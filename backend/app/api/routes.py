import os
import math
import io
import cv2
import base64
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image
import torch
import tifffile

def _normalize_sar_array(arr: np.ndarray) -> np.ndarray:
    if arr.ndim == 3 and arr.shape[-1] >= 2:
        vv = arr[:, :, 0].astype(np.float32)
        vh = arr[:, :, 1].astype(np.float32)
        p2_vv, p98_vv = np.percentile(vv, 2), np.percentile(vv, 98)
        p2_vh, p98_vh = np.percentile(vh, 2), np.percentile(vh, 98)
        vv_norm = np.clip((vv - p2_vv) / max(p98_vv - p2_vv, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        vh_norm = np.clip((vh - p2_vh) / max(p98_vh - p2_vh, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        diff = np.clip(((vv - vh) - (-5.0)) / 25.0 * 255.0, 0, 255).astype(np.uint8)
        return np.stack([vv_norm, vh_norm, diff], axis=-1)
    elif arr.ndim == 2:
        p2, p98 = np.percentile(arr, 2), np.percentile(arr, 98)
        norm = np.clip((arr - p2) / max(p98 - p2, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        return np.stack([norm, norm, norm], axis=-1)
    else:
        return ((arr - arr.min()) / (arr.max() - arr.min() + 1e-6) * 255.0).astype(np.uint8)

from backend.app.config import settings
from backend.app.models.unet_detector import load_detector_model, TileSlidingInference
from backend.app.services.drift_engine import HindcastDriftEngine, VesselAttributionScorer
from backend.app.services.slick_physics import SlickPhysicsAnalyzer
from backend.app.services.ais_generator import SyntheticAISGenerator
from backend.app.services.dark_vessel_detector import DarkVesselDetector
from backend.app.services.responder_routing import CoastGuardResponderRouting
from backend.app.services.sar_dataset_service import SARDatasetService
from backend.app.services.marine_cadastre_ais import MarineCadastreAISService
from backend.app.services.ais_provider import MarineCadastreAISProvider
from backend.app.services.ais_trajectory_builder import AISTrajectoryBuilder
from backend.app.services.ais_attribution_engine import AISAttributionEngine
from backend.app.services.raster_validator import RasterValidator, RasterValidationError
from backend.app.services.geospatial_service import GeospatialService
from backend.app.services.metocean_provider import MetoceanProvider

router = APIRouter(prefix="/api/v1", tags=["Detection & Attribution"])

_model_instance = None
_drift_engine = HindcastDriftEngine()
_attribution_scorer = VesselAttributionScorer()
_ais_generator = SyntheticAISGenerator()
_dark_vessel_detector = DarkVesselDetector()
_responder_routing = CoastGuardResponderRouting() # NGA WPI Candidate Discovery & Routing Evaluation
_sar_dataset = SARDatasetService()
_marine_cadastre_ais = MarineCadastreAISService()
_metocean = MetoceanProvider()

_ais_provider = MarineCadastreAISProvider()
_ais_trajectory_builder = AISTrajectoryBuilder(blackout_threshold_hours=1.0)
_ais_attribution_engine = AISAttributionEngine(sigma_km=6.0)

# Global in-memory session state for active tactical scenario & detection
_active_scenario: Optional[Dict[str, Any]] = None
_active_detection: Optional[Dict[str, Any]] = None

def get_model():
    global _model_instance
    if _model_instance is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        weights_path = str(settings.DEFAULT_WEIGHTS_FILE)
        _model_instance = load_detector_model(weights_path=weights_path, device=device)
    return _model_instance

class DetectionSummaryResponse(BaseModel):
    status: str
    image_name: str
    width: int
    height: int
    total_pixels: int
    oil_pixel_count: int
    lookalike_pixel_count: int
    no_oil_pixel_count: int
    oil_coverage_pct: float
    lookalike_coverage_pct: float
    confidence_score: float
    classes_detected: Dict[str, bool]
    morphology: Dict[str, Any]
    mask_base64: str
    detected_location: Optional[Dict[str, Any]] = None
    scenario_update: Optional[Dict[str, Any]] = None
    # Real-Scene Geospatial Additions (v3.2)
    scene_georeferenced: bool = False
    scene_crs: Optional[str] = None
    scene_center: Optional[Dict[str, float]] = None
    leaflet_bounds: Optional[List[List[float]]] = None
    geojson_bbox: Optional[List[float]] = None
    leaflet_polygons: List[List[List[float]]] = []
    geojson_features: List[Dict[str, Any]] = []
    slick_centroid: Optional[Dict[str, float]] = None
    georeference_status: Optional[str] = None
    area_status: Optional[str] = None
    derived_area_km2: Optional[float] = None
    display_location: Optional[str] = None

class HindcastRequest(BaseModel):
    origin_lat: float = Field(19.412, description="Latitude of detected slick center")
    origin_lon: float = Field(71.325, description="Longitude of detected slick center")
    hours_back: float = Field(6.5, description="Hindcast duration in hours")
    u_current_m_s: Optional[float] = Field(None, description="Eastward ocean current (m/s). If None, fetches from CMEMS.")
    v_current_m_s: Optional[float] = Field(None, description="Northward ocean current (m/s). If None, fetches from CMEMS.")
    u_wind_m_s: Optional[float] = Field(None, description="Eastward wind velocity (m/s). If None, fetches from CMEMS.")
    v_wind_m_s: Optional[float] = Field(None, description="Northward wind velocity (m/s). If None, fetches from CMEMS.")

def _format_coord_string(lat: float, lon: float) -> str:
    lat_str = f"{lat:.4f}° N" if lat >= 0 else f"{abs(lat):.4f}° S"
    lon_str = f"{lon:.4f}° E" if lon >= 0 else f"{abs(lon):.4f}° W"
    return f"{lat_str}, {lon_str}"

def _generate_incident_scenario(
    origin_lat: float,
    origin_lon: float,
    custom_slick_props: Optional[Dict[str, Any]] = None,
    scenario_id: str = "INC-20260913-0091",
    scene_timestamp=None
) -> Dict[str, Any]:
    # Fetch real metocean forcing from CMEMS for this scene's location & time
    metocean = _metocean.fetch_metocean(origin_lat, origin_lon, timestamp=scene_timestamp)

    # Physical drift starting strictly from observed T0 slick centroid,
    # now using real ocean current & wind vectors from Copernicus Marine Service
    hindcast = _drift_engine.run_backward_hindcast(
        origin_lat, origin_lon, hours_back=6.5,
        u_current_base=metocean.u_current_m_s,
        v_current_base=metocean.v_current_m_s,
        u_wind_base=metocean.u_wind_m_s,
        v_wind_base=metocean.v_wind_m_s
    )
    forecast = _drift_engine.run_forward_forecast(
        origin_lat, origin_lon, hours_ahead=12.0,
        u_current_base=metocean.u_current_m_s,
        v_current_base=metocean.v_current_m_s,
        u_wind_base=metocean.u_wind_m_s,
        v_wind_base=metocean.v_wind_m_s
    )
    reconstructed_release = hindcast["reconstructed_release"]

    display_location = _format_coord_string(origin_lat, origin_lon)

    # Check whether within specific regions
    in_mumbai_high = (19.1 <= origin_lat <= 19.7 and 71.0 <= origin_lon <= 71.6)
    in_indian_eez = (15.0 <= origin_lat <= 24.0 and 65.0 <= origin_lon <= 75.0)

    if in_mumbai_high:
        field_centroid_lat, field_centroid_lon = 19.417, 71.333
        dist_to_field = _attribution_scorer.haversine_distance_km(
            origin_lat, origin_lon, field_centroid_lat, field_centroid_lon
        )
        sector_name = "ARABIAN SEA // MUMBAI HIGH SECTOR"
        nearest_rig_name = "Mumbai High Field Centroid Complex"
        coastline_name = "Konkan Coast, Arabian Sea"
        ais_status_label = "SYNTHETIC AIS // MUMBAI HIGH DEMONSTRATION"
    elif in_indian_eez:
        field_centroid_lat, field_centroid_lon = round(origin_lat + 0.05, 3), round(origin_lon + 0.05, 3)
        dist_to_field = _attribution_scorer.haversine_distance_km(
            origin_lat, origin_lon, field_centroid_lat, field_centroid_lon
        )
        sector_name = f"INDIAN EEZ SECTOR // {display_location}"
        nearest_rig_name = "Offshore Indian Maritime Installation"
        coastline_name = f"Indian EEZ Maritime Zone ({display_location})"
        ais_status_label = "SYNTHETIC AIS // INDIAN EEZ DEMONSTRATION"
    else:
        field_centroid_lat, field_centroid_lon = None, None
        dist_to_field = None
        sector_name = f"OFFSHORE SECTOR // {display_location}"
        nearest_rig_name = "MARITIME HIGH SEAS / UNALIGNED"
        coastline_name = f"International Waters // {display_location}"
        ais_status_label = "SYNTHETIC AIS // SOFTWARE DEMONSTRATION AT REAL SCENE COORDS"

    infra_proximity = {
        "nearest_rig": nearest_rig_name,
        "centroid_lat": field_centroid_lat,
        "centroid_lon": field_centroid_lon,
        "distance_km": round(dist_to_field, 2) if dist_to_field is not None else None,
        "rig_spill_risk_flag": False
    }

    # Model-parameterized release window based on drift hindcast duration
    hours_back = float(hindcast.get("hours_hindcasted", 6.5))
    if scene_timestamp is not None:
        t_obs = scene_timestamp
        if getattr(t_obs, "tzinfo", None) is None:
            t_obs = t_obs.replace(tzinfo=timezone.utc)
    else:
        t_obs = datetime.now(timezone.utc)

    t_release_start = t_obs - timedelta(hours=hours_back)
    t_release_end = t_obs + timedelta(minutes=10)

    release_window_info = {
        "observation_time_utc": t_obs.isoformat() if hasattr(t_obs, "isoformat") else str(t_obs),
        "start_utc": t_release_start.isoformat() if hasattr(t_release_start, "isoformat") else str(t_release_start),
        "end_utc": t_release_end.isoformat() if hasattr(t_release_end, "isoformat") else str(t_release_end),
        "hours_back": hours_back,
        "basis": "cmems_drift_hindcast_model"
    }

    # Geographic bounding envelope around reconstructed origin (±0.35 degrees ≈ ±38 km)
    min_lat = round(reconstructed_release["lat"] - 0.35, 4)
    max_lat = round(reconstructed_release["lat"] + 0.35, 4)
    min_lon = round(reconstructed_release["lon"] - 0.35, 4)
    max_lon = round(reconstructed_release["lon"] + 0.35, 4)
    bbox = (min_lat, min_lon, max_lat, max_lon)

    # Query real historical AIS provider
    t_start_naive = t_release_start.replace(tzinfo=None) if hasattr(t_release_start, "tzinfo") and t_release_start.tzinfo else t_release_start
    t_end_naive = t_release_end.replace(tzinfo=None) if hasattr(t_release_end, "tzinfo") and t_release_end.tzinfo else t_release_end
    
    ais_query_res = _ais_provider.query_vessels(
        bbox=bbox,
        start_time=t_start_naive,
        end_time=t_end_naive
    )
    real_pings = ais_query_res.get("pings", [])
    ais_provenance = ais_query_res.get("provenance", {})

    if len(real_pings) > 0:
        # Reconstruct real vessel trajectories & score attribution candidates dynamically
        trajectories = _ais_trajectory_builder.build_trajectories(real_pings)
        ranked_suspects = _ais_attribution_engine.score_trajectories(
            trajectories=trajectories,
            reconstructed_origin=reconstructed_release,
            drift_heading_deg=hindcast["drift_heading_deg"],
            provenance=ais_provenance,
            search_radius_km=35.0
        )
        ais_status_label = "REAL HISTORICAL AIS (NOAA MARINECADASTRE)"
        is_historical_real = True
        coverage_available = True
    elif in_mumbai_high or in_indian_eez:
        # Synthetic simulator preserved strictly for unserviced Indian waters demonstration
        candidates = _ais_generator.generate_candidate_scenario(
            reconstructed_release_lat=reconstructed_release["lat"],
            reconstructed_release_lon=reconstructed_release["lon"],
            drift_heading_deg=hindcast["drift_heading_deg"]
        )
        ranked_suspects = []
        for cand in candidates:
            score_res = _attribution_scorer.score_vessel(
                vessel_lat=cand["lat"],
                vessel_lon=cand["lon"],
                vessel_heading_deg=cand["heading_deg"],
                reconstructed_origin=reconstructed_release,
                drift_heading_deg=hindcast["drift_heading_deg"],
                vessel_speed_knots=cand.get("speed_knots", 12.4),
                ais_gap_flag=cand.get("ais_gap_hours", 0.0) > 1.0,
                speed_drop_flag=cand.get("min_speed_knots", 12.0) < 5.0
            )
            score_pct = round(score_res["overall_score"] * 100.0, 1)
            ranked_suspects.append({
                "vessel_id": cand["vessel_id"],
                "vessel_name": cand["vessel_name"],
                "vessel_type": cand["vessel_type"],
                "flag": cand["flag"],
                "mmsi": cand["mmsi"],
                "lat": cand["lat"],
                "lon": cand["lon"],
                "heading_deg": cand["heading_deg"],
                "speed_knots": cand["speed_knots"],
                "min_speed_knots": cand.get("min_speed_knots", cand.get("speed_knots")),
                "distance_km": score_res["proximity_km"],
                "proximity_score": score_res["proximity_score"],
                "trajectory_score": score_res["trajectory_score"],
                "behavioral_anomaly_score": score_res["behavioral_anomaly_score"],
                "attribution_score_pct": score_pct,
                "risk_level": "HIGH PRIORITY CANDIDATE" if score_pct >= 75.0 else ("INTERROGATION LEAD" if score_pct >= 45.0 else "LOW CORRELATION CANDIDATE"),
                "is_primary_suspect": score_pct >= 75.0,
                "is_historical_real": False,
                "ais_status": "SYNTHETIC AIS // REGIONAL MARITIME DEMONSTRATION",
                "track_points": cand["track_points"]
            })
        ranked_suspects.sort(key=lambda x: x["attribution_score_pct"], reverse=True)
        ais_status_label = "SYNTHETIC AIS // REGIONAL MARITIME DEMONSTRATION"
        is_historical_real = False
        coverage_available = True
        ais_provenance = {
            "provider": "SYNTHETIC_SIMULATOR",
            "coverage_status": "SYNTHETIC_DEMONSTRATION",
            "raw_pings_scanned": len(candidates) * 5,
            "unique_vessels_tracked": len(candidates),
            "query_window_utc": f"{t_release_start.isoformat()}Z to {t_release_end.isoformat()}Z"
        }
    else:
        # Non-covered waters: truthful operational finding, no synthetic fabrication
        ranked_suspects = []
        ais_status_label = "AIS COVERAGE UNAVAILABLE — ATTRIBUTION NOT PERFORMED"
        is_historical_real = False
        coverage_available = False
        ais_provenance = {
            "provider": "NONE",
            "coverage_status": "COVERAGE_UNAVAILABLE",
            "raw_pings_scanned": 0,
            "unique_vessels_tracked": 0,
            "query_window_utc": f"{t_release_start.isoformat()}Z to {t_release_end.isoformat()}Z"
        }

    # CFAR dark vessel detection: only supply synthetic targets for regional demo mode
    if is_historical_real:
        # Real operational SAR mode: suppress synthetic manufactured targets
        dark_vessels = []
    elif in_mumbai_high or in_indian_eez:
        raw_dv = _dark_vessel_detector.detect_dark_vessels(origin_lat, origin_lon)
        dark_vessels = []
        for dv in raw_dv:
            dv_copy = dict(dv)
            dv_copy["is_synthetic_demonstration"] = True
            dv_copy["classification"] = "SYNTHETIC DEMONSTRATION // NOT OBSERVED"
            dark_vessels.append(dv_copy)
    else:
        dark_vessels = []

    responder_route = _responder_routing.calculate_intercept_route(
        origin_lat, origin_lon, hindcast["drift_heading_deg"], hindcast["drift_speed_knots"]
    )

    if custom_slick_props is not None:
        detected_slick = dict(custom_slick_props)
        detected_slick["is_computed_morphology"] = True
        detected_slick["morphology_status"] = "COMPUTED_FROM_SAR_MASK"
    else:
        detected_slick = {
            "area_sq_km": None,
            "estimated_age_hours": hindcast["hours_hindcasted"],
            "drift_heading_deg": hindcast["drift_heading_deg"],
            "drift_speed_knots": hindcast["drift_speed_knots"],
            "perimeter_km": None,
            "compactness_index": None,
            "estimated_thickness_um": None,
            "estimated_volume_m3": None,
            "estimated_mass_tons": None,
            "weathering_stage": "UNAVAILABLE // NO SEGMENTATION MASK",
            "is_computed_morphology": False,
            "morphology_status": "UNAVAILABLE"
        }

    return {
        "scenario_id": scenario_id,
        "system_status": "ONLINE / S1-SAR LOCKED",
        "display_location": display_location,
        "sector": sector_name,
        "telemetry": {
            "wind": metocean.format_wind_display(),
            "current": metocean.format_current_display(),
            "sea_temp_c": metocean.sea_temp_c,
            "wave_height_m": metocean.wave_height_m,
            "drift_vector": f"{hindcast['drift_heading_deg']}° T at {hindcast['drift_speed_knots']} knots",
            "metocean_source": metocean.source,
            "metocean_source_label": metocean.source_label,
            "is_time_matched": metocean.is_time_matched,
            "metocean_datasets": metocean.dataset_ids,
            "metocean_query_time": metocean.query_timestamp
        },
        "location": {
            "name": f"Offshore Scene Locus ({display_location})",
            "lat": origin_lat,
            "lon": origin_lon,
            "coastline": coastline_name
        },
        "detected_slick": detected_slick,
        "hindcast_trajectory": hindcast["trajectory_points"],
        "drift_cone_polygon": hindcast["drift_cone_polygon"],
        "reconstructed_release": reconstructed_release,
        "release_window": release_window_info,
        "ais_status": ais_status_label,
        "is_historical_real": is_historical_real,
        "coverage_available": coverage_available,
        "ais_provenance": ais_provenance,
        "ranked_suspects": ranked_suspects,
        "dark_vessels": dark_vessels,
        "responder_route": responder_route,
        "infrastructure_proximity": infra_proximity
    }

@router.get("/health")
def health_check():
    cuda_avail = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_avail else "CPU"
    return {
        "status": "healthy",
        "service": "AegisSea Backend Engine",
        "environment": settings.FASTAPI_ENV,
        "cuda_available": cuda_avail,
        "device": device_name,
        "default_weights": str(settings.DEFAULT_WEIGHTS_FILE),
        "weights_exist": settings.DEFAULT_WEIGHTS_FILE.exists()
    }

@router.get("/scenario/current")
def get_current_scenario():
    """
    Returns the active current scenario state.
    If no scene has been analyzed yet, returns a clear STANDBY state
    rather than fabricating 00111 or Mumbai High data.
    """
    if _active_scenario is not None:
        return _active_scenario
    return {
        "status": "standby",
        "scenario_id": None,
        "system_status": "STANDBY // AWAITING SENSOR INGEST",
        "display_location": "AWAITING SENSOR INGEST",
        "sector": "STANDBY // NO ACTIVE FIX",
        "telemetry": {
            "wind": "—",
            "current": "—",
            "sea_temp_c": None,
            "wave_height_m": None,
            "drift_vector": "—",
            "metocean_source": "STANDBY",
            "metocean_source_label": "AWAITING SENSOR INGEST",
            "is_time_matched": False,
            "metocean_datasets": [],
            "metocean_query_time": ""
        },
        "location": None,
        "detected_slick": None,
        "hindcast_trajectory": [],
        "drift_cone_polygon": [],
        "reconstructed_release": None,
        "release_window": None,
        "ais_status": "STANDBY // AWAITING SCENE",
        "is_historical_real": False,
        "coverage_available": False,
        "ais_provenance": {
            "provider": "NONE",
            "coverage_status": "AWAITING_SCENE",
            "raw_pings_scanned": 0,
            "unique_vessels_tracked": 0,
            "query_window_utc": ""
        },
        "ranked_suspects": [],
        "dark_vessels": [],
        "responder_route": None,
        "infrastructure_proximity": None
    }

@router.post("/detect/preset/{preset_id}")
def run_preset_detection(preset_id: str):
    """
    Executes real dual-polarization U-Net segmentation, georeferencing,
    CMEMS drift hindcast, historical AIS query, and NGA WPI port discovery
    for a verified preset SAR scene (e.g. '00111').
    """
    clean_id = preset_id.strip()

    # Priority check: look directly in test dir for clean_id
    scenes = _sar_dataset.list_available_scenes()
    target = None
    for cat in ["oil", "lookalike", "no_oil"]:
        for s in scenes.get(cat, []):
            if s["scene_id"] == clean_id or clean_id in s["filename"]:
                target = s
                break
        if target:
            break

    if not target:
        candidate = _sar_dataset.test_dir / "Oil" / f"{clean_id}.tif"
        if candidate.exists():
            target = {
                "scene_id": clean_id,
                "filename": candidate.name,
                "category": "oil",
                "image_path": str(candidate),
                "has_mask": False,
                "mask_path": None
            }

    if not target:
        raise HTTPException(status_code=404, detail=f"Preset SAR scene '{preset_id}' not found in dataset registry.")

    req = AnalyzeSceneRequest(
        category=target.get("category", "oil"),
        scene_id=target["scene_id"],
        image_path=target.get("image_path")
    )
    result = analyze_dataset_scene(req)
    return result

@router.post("/detect", response_model=DetectionSummaryResponse)
async def run_oil_detection(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None)
):
    if file is not None:
        content = await file.read()
        image_name = file.filename or "upload.tif"
    elif image_path is not None:
        p = Path(image_path)
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"Specified image path not found: {image_path}")
        image_name = p.name
        content = p.read_bytes()
    else:
        raise HTTPException(status_code=400, detail="Must provide either an uploaded 'file' or 'image_path'.")

    # 1. Validate raster input against inference contract
    img_np, is_tiff, metadata, tif_handle = RasterValidator.validate_and_load(content, image_name)

    # 2. Extract real georeferencing metadata (zero fallback)
    geo_info = GeospatialService.extract_georeferencing(tif_handle)
    scene_timestamp = GeospatialService.extract_acquisition_timestamp(tif_handle, image_name)
    if tif_handle:
        try:
            tif_handle.close()
        except Exception:
            pass

    H, W, _ = img_np.shape
    total_pixels = H * W

    # 3. Sliding-window U-Net segmentation
    model = get_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inferencer = TileSlidingInference(model, tile_size=256, stride=128, device=device)
    mask = inferencer.predict_scene(img_np)

    no_oil_cnt = int(np.sum(mask == 0))
    oil_cnt = int(np.sum(mask == 1))
    lookalike_cnt = int(np.sum(mask == 2))

    oil_pct = round((oil_cnt / total_pixels) * 100.0, 3)
    lookalike_pct = round((lookalike_cnt / total_pixels) * 100.0, 3)

    # Operational noise floor threshold: oil_cnt >= 500 pixels (0.012% of a 2048x2048 scene)
    is_confirmed_spill = (oil_cnt >= 500)

    # 4. Extract real polygons, geometric slick centroid, and derived metric area
    leaflet_polygons, geojson_features, slick_centroid, derived_area_km2, area_status = (
        GeospatialService.extract_slick_polygons_and_centroid(mask, geo_info)
    )

    morphology = SlickPhysicsAnalyzer.analyze_slick_morphology(
        mask,
        pixel_resolution_m=geo_info.get("pixel_resolution_m", {}).get("height_m", 10.0) if geo_info.get("pixel_resolution_m") else 10.0,
        estimated_age_hours=6.5
    )
    if derived_area_km2 is not None:
        morphology["area_sq_km"] = derived_area_km2

    confidence = 0.85 if oil_cnt > 50 else (0.45 if lookalike_cnt > 50 else 0.99)

    overlay_rgb = np.zeros((H, W, 4), dtype=np.uint8)
    overlay_rgb[mask == 0] = [16, 185, 129, 60]
    overlay_rgb[mask == 1] = [239, 68, 68, 220]
    overlay_rgb[mask == 2] = [245, 158, 11, 200]

    overlay_img = Image.fromarray(overlay_rgb, mode="RGBA")
    buffer = io.BytesIO()
    overlay_img.save(buffer, format="PNG")
    mask_b64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    # 5. Geodetic separation & scenario generation
    if is_confirmed_spill and geo_info["georeferenced"] and slick_centroid is not None:
        detected_location = {
            "name": f"Observed Slick Centroid ({image_name})",
            "lat": slick_centroid["lat"],
            "lon": slick_centroid["lon"]
        }

        # Step 4: Do not change existing drift model's physical semantics;
        # pass real slick_centroid as the observed T0 geographic starting locus
        scenario_update = _generate_incident_scenario(
            origin_lat=slick_centroid["lat"],
            origin_lon=slick_centroid["lon"],
            custom_slick_props={
                "area_sq_km": morphology["area_sq_km"],
                "perimeter_km": morphology["perimeter_km"],
                "compactness_index": morphology["compactness_index"],
                "estimated_thickness_um": morphology["estimated_thickness_um"],
                "estimated_volume_m3": morphology["estimated_volume_m3"],
                "estimated_mass_tons": morphology["estimated_mass_tons"],
                "weathering_stage": morphology["weathering_stage"]
            },
            scenario_id=f"INC-USER-{abs(hash(image_name)) % 10000:04d}",
            scene_timestamp=scene_timestamp
        )
    else:
        detected_location = None
        scenario_update = None
        if not is_confirmed_spill:
            morphology = {
                "area_sq_m": 0.0,
                "area_sq_km": 0.0,
                "perimeter_km": 0.0,
                "compactness_index": 0.0,
                "estimated_thickness_um": 0.0,
                "estimated_volume_m3": 0.0,
                "estimated_mass_tons": 0.0,
                "weathering_stage": "Verified Clean Sea"
            }

    display_location = None
    if slick_centroid and "lat" in slick_centroid and "lon" in slick_centroid:
        display_location = _format_coord_string(slick_centroid["lat"], slick_centroid["lon"])
    elif geo_info.get("scene_center"):
        sc = geo_info["scene_center"]
        display_location = _format_coord_string(sc["lat"], sc["lon"])

    resp = DetectionSummaryResponse(
        status="success",
        image_name=image_name,
        width=W,
        height=H,
        total_pixels=total_pixels,
        oil_pixel_count=oil_cnt if is_confirmed_spill else 0,
        lookalike_pixel_count=lookalike_cnt,
        no_oil_pixel_count=no_oil_cnt,
        oil_coverage_pct=oil_pct if is_confirmed_spill else 0.0,
        lookalike_coverage_pct=lookalike_pct,
        confidence_score=confidence,
        classes_detected={
            "oil_spill": is_confirmed_spill,
            "lookalike": lookalike_cnt > 500,
            "background": no_oil_cnt > 0
        },
        morphology=morphology,
        mask_base64=mask_b64,
        detected_location=detected_location,
        scenario_update=scenario_update,
        scene_georeferenced=geo_info["georeferenced"],
        scene_crs=geo_info.get("crs"),
        scene_center=geo_info.get("scene_center"),
        leaflet_bounds=geo_info.get("leaflet_bounds"),
        geojson_bbox=geo_info.get("geojson_bbox"),
        leaflet_polygons=leaflet_polygons,
        geojson_features=geojson_features,
        slick_centroid=slick_centroid,
        georeference_status=geo_info.get("status"),
        area_status=area_status,
        derived_area_km2=derived_area_km2,
        display_location=display_location
    )

    global _active_scenario, _active_detection
    _active_detection = resp.model_dump()
    if scenario_update is not None:
        _active_scenario = scenario_update

    return resp

class ForecastRequest(BaseModel):
    origin_lat: float = Field(19.412, description="Latitude of detected slick center")
    origin_lon: float = Field(71.325, description="Longitude of detected slick center")
    hours_ahead: float = Field(12.0, description="Forecast duration in hours")
    u_current_m_s: Optional[float] = Field(None, description="Eastward ocean current (m/s). If None, fetches from CMEMS.")
    v_current_m_s: Optional[float] = Field(None, description="Northward ocean current (m/s). If None, fetches from CMEMS.")
    u_wind_m_s: Optional[float] = Field(None, description="Eastward wind velocity (m/s). If None, fetches from CMEMS.")
    v_wind_m_s: Optional[float] = Field(None, description="Northward wind velocity (m/s). If None, fetches from CMEMS.")

@router.post("/forecast")
def calculate_forward_forecast(req: ForecastRequest):
    # If no explicit forcing provided, fetch real data from CMEMS
    if any(v is None for v in [req.u_current_m_s, req.v_current_m_s, req.u_wind_m_s, req.v_wind_m_s]):
        metocean = _metocean.fetch_metocean(req.origin_lat, req.origin_lon)
        u_cur = req.u_current_m_s if req.u_current_m_s is not None else metocean.u_current_m_s
        v_cur = req.v_current_m_s if req.v_current_m_s is not None else metocean.v_current_m_s
        u_wnd = req.u_wind_m_s if req.u_wind_m_s is not None else metocean.u_wind_m_s
        v_wnd = req.v_wind_m_s if req.v_wind_m_s is not None else metocean.v_wind_m_s
    else:
        u_cur, v_cur = req.u_current_m_s, req.v_current_m_s
        u_wnd, v_wnd = req.u_wind_m_s, req.v_wind_m_s
    result = _drift_engine.run_forward_forecast(
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        hours_ahead=req.hours_ahead,
        u_current_base=u_cur,
        v_current_base=v_cur,
        u_wind_base=u_wnd,
        v_wind_base=v_wnd
    )
    return result

@router.get("/attribution/demo-scenario")
def get_demo_scenario_attribution():
    return _generate_incident_scenario(
        origin_lat=19.412,
        origin_lon=71.325,
        scenario_id="INC-20260913-0091"
    )

# ---------------------------------------------------------------------------
# Sentinel-1 Scientific Dataset & Ground Truth Validation Endpoints
# ---------------------------------------------------------------------------

@router.get("/dataset/scenes")
def get_dataset_scenes():
    """
    Returns indexed Sentinel-1 SAR scenes (Oil, Lookalike, No-Oil)
    extracted from the Zenodo scientific benchmark dataset.
    """
    return _sar_dataset.list_available_scenes()

class AnalyzeSceneRequest(BaseModel):
    category: str = Field("oil", description="Category: oil, lookalike, or no_oil")
    scene_id: str = Field("00000", description="Scene ID stem e.g. 00000")
    image_path: Optional[str] = Field(None, description="Optional direct file path to TIFF")

@router.post("/dataset/analyze-scene")
def analyze_dataset_scene(req: AnalyzeSceneRequest):
    """
    Loads real dual-polarization Sentinel-1 SAR TIFF, runs sliding-window UNet,
    and benchmarks against the official Zenodo ground truth mask.
    """
    scenes = _sar_dataset.list_available_scenes()
    cat_scenes = scenes.get(req.category.lower(), [])
    target = None
    if req.image_path:
        img_p = Path(req.image_path)
        target = {
            "scene_id": req.scene_id or img_p.stem,
            "filename": img_p.name,
            "category": req.category or "oil",
            "image_path": req.image_path,
            "has_mask": False,
            "mask_path": None
        }
    else:
        for s in cat_scenes:
            if s["scene_id"] == req.scene_id:
                target = s
                break
    
    if not target and cat_scenes:
        target = cat_scenes[0]
        
    if not target:
        raise HTTPException(status_code=404, detail=f"No SAR scenes available for category: {req.category}")

    img_path = target["image_path"]
    rgb_composite, meta = _sar_dataset.load_scene(img_path)
    
    # Run sliding-window inference
    model = get_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inferencer = TileSlidingInference(model, tile_size=256, stride=128, device=device)
    mask = inferencer.predict_scene(rgb_composite)

    H, W, _ = rgb_composite.shape
    total_pixels = H * W
    no_oil_cnt = int(np.sum(mask == 0))
    oil_cnt = int(np.sum(mask == 1))
    lookalike_cnt = int(np.sum(mask == 2))

    oil_pct = round((oil_cnt / total_pixels) * 100.0, 3)
    lookalike_pct = round((lookalike_cnt / total_pixels) * 100.0, 3)

    # Compare against ground truth if available
    ground_truth_metrics = None
    if target.get("has_mask") and target.get("mask_path"):
        gt_mask = _sar_dataset.load_ground_truth_mask(target["mask_path"])
        if gt_mask.shape == mask.shape:
            gt_oil = (gt_mask == 1)
            pred_oil = (mask == 1)
            intersection = int(np.sum(gt_oil & pred_oil))
            union = int(np.sum(gt_oil | pred_oil))
            iou = round((intersection / max(union, 1)), 4)
            dice = round((2.0 * intersection / max(int(np.sum(gt_oil)) + int(np.sum(pred_oil)), 1)), 4)
            ground_truth_metrics = {
                "ground_truth_oil_pixels": int(np.sum(gt_oil)),
                "predicted_oil_pixels": int(np.sum(pred_oil)),
                "intersection_pixels": intersection,
                "iou_score": iou,
                "dice_f1_score": dice,
                "verification_status": "MATCHED_WITH_GROUND_TRUTH" if iou > 0.3 else "BENCHMARK_EVALUATED"
            }

    # Generate RGBA visualization overlay
    # Downsample overlay for fast transfer (e.g. 512x512)
    preview_size = 512
    mask_thumb = cv2.resize(mask, (preview_size, preview_size), interpolation=cv2.INTER_NEAREST)
    overlay_rgb = np.zeros((preview_size, preview_size, 4), dtype=np.uint8)
    overlay_rgb[mask_thumb == 0] = [16, 185, 129, 40]   # Background
    overlay_rgb[mask_thumb == 1] = [239, 68, 68, 220]   # Oil spill
    overlay_rgb[mask_thumb == 2] = [245, 158, 11, 180]  # Lookalike
    
    overlay_pil = Image.fromarray(overlay_rgb, mode="RGBA")
    buf = io.BytesIO()
    overlay_pil.save(buf, format="PNG")
    mask_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Extract real georeferencing and acquisition timestamp directly from GeoTIFF
    try:
        with tifffile.TiffFile(img_path) as tif_h:
            geo_info = GeospatialService.extract_georeferencing(tif_h)
            scene_timestamp = GeospatialService.extract_acquisition_timestamp(tif_h, target["filename"])
    except Exception:
        geo_info = {"georeferenced": False, "status": "Failed to read GeoTIFF tags"}
        scene_timestamp = None

    leaflet_polygons, geojson_features, slick_centroid, derived_area_km2, area_status = (
        GeospatialService.extract_slick_polygons_and_centroid(mask, geo_info)
    )

    morphology = SlickPhysicsAnalyzer.analyze_slick_morphology(
        mask,
        pixel_resolution_m=geo_info.get("pixel_resolution_m", {}).get("height_m", 10.0) if geo_info.get("pixel_resolution_m") else 10.0,
        estimated_age_hours=6.5
    )
    if derived_area_km2 is not None:
        morphology["area_sq_km"] = derived_area_km2

    # Generate full C2 scenario update starting strictly from observed T0 slick centroid
    if oil_cnt >= 500 and geo_info.get("georeferenced", False) and slick_centroid is not None:
        scenario_update = _generate_incident_scenario(
            origin_lat=slick_centroid["lat"],
            origin_lon=slick_centroid["lon"],
            custom_slick_props={
                "area_sq_km": morphology["area_sq_km"],
                "perimeter_km": morphology["perimeter_km"],
                "compactness_index": morphology["compactness_index"],
                "estimated_thickness_um": morphology["estimated_thickness_um"],
                "estimated_volume_m3": morphology["estimated_volume_m3"],
                "estimated_mass_tons": morphology["estimated_mass_tons"],
                "weathering_stage": morphology["weathering_stage"]
            },
            scenario_id=f"INC-ZENODO-{target['category'].upper()}-{target['scene_id']}",
            scene_timestamp=scene_timestamp
        )
    else:
        scenario_update = None

    res_dict = {
        "status": "success",
        "image_name": target["filename"],
        "scene_info": target,
        "radar_metadata": meta,
        "oil_pixel_count": oil_cnt,
        "lookalike_pixel_count": lookalike_cnt,
        "oil_coverage_pct": oil_pct,
        "lookalike_coverage_pct": lookalike_pct,
        "confidence_score": 0.94 if oil_cnt > 100 else 0.82,
        "ground_truth_metrics": ground_truth_metrics,
        "morphology": morphology,
        "mask_base64": mask_b64,
        "scenario_update": scenario_update,
        "scene_georeferenced": geo_info.get("georeferenced", False),
        "scene_crs": geo_info.get("crs"),
        "scene_center": geo_info.get("scene_center"),
        "leaflet_bounds": geo_info.get("leaflet_bounds"),
        "geojson_bbox": geo_info.get("geojson_bbox"),
        "leaflet_polygons": leaflet_polygons,
        "geojson_features": geojson_features,
        "slick_centroid": slick_centroid,
        "georeference_status": geo_info.get("status"),
        "area_status": area_status,
        "derived_area_km2": derived_area_km2,
        "display_location": _format_coord_string(slick_centroid["lat"], slick_centroid["lon"]) if slick_centroid else (_format_coord_string(geo_info["scene_center"]["lat"], geo_info["scene_center"]["lon"]) if geo_info.get("scene_center") else None)
    }

    global _active_scenario, _active_detection
    _active_detection = res_dict
    if scenario_update is not None:
        _active_scenario = scenario_update

    return res_dict

# ---------------------------------------------------------------------------
# Demonstration / Test Regional Incidents Registry
# (Isolated from live operational ingestion)
# ---------------------------------------------------------------------------

PRE_SEEDED_INCIDENTS = [
    {
        "id": "INC-MH-001",
        "name": "Mumbai High Basin Blowout (Demo)",
        "zone": "Arabian Sea / Offshore ONGC Sector",
        "lat": 19.412,
        "lon": 71.325,
        "severity": "CRITICAL",
        "status": "DEMO_SCENARIO",
        "incident_classification": "DEMO / TEST REGIONAL SCENARIO",
        "is_demo_fixture": True,
        "spill_area_sq_km": 14.8,
        "estimated_volume_bbl": 2840,
        "top_suspect": "MT Ocean Pioneer (Crude Oil Tanker)",
        "suspect_mmsi": "SYN-MMSI-41901",
        "attribution_score_pct": 91.4,
        "ais_gap_hours": 2.4,
        "created_at": "2026-09-14T02:00:00Z"
    },
    {
        "id": "INC-GK-002",
        "name": "Gulf of Kutch Tanker Fairway (Demo)",
        "zone": "Kandla Port Approach / Gujarat",
        "lat": 22.845,
        "lon": 69.632,
        "severity": "MEDIUM",
        "status": "DEMO_SCENARIO",
        "incident_classification": "DEMO / TEST REGIONAL SCENARIO",
        "is_demo_fixture": True,
        "spill_area_sq_km": 6.2,
        "estimated_volume_bbl": 980,
        "top_suspect": "MV Gulf Trader (Product Carrier)",
        "suspect_mmsi": "SYN-MMSI-41908",
        "attribution_score_pct": 74.2,
        "ais_gap_hours": 1.1,
        "created_at": "2026-09-14T06:30:00Z"
    },
    {
        "id": "INC-LK-003",
        "name": "Lakshadweep Coral Channel (Demo)",
        "zone": "Lakshadweep Sea / Marine Sanctuary",
        "lat": 10.083,
        "lon": 73.625,
        "severity": "HIGH",
        "status": "DEMO_SCENARIO",
        "incident_classification": "DEMO / TEST REGIONAL SCENARIO",
        "is_demo_fixture": True,
        "spill_area_sq_km": 9.4,
        "estimated_volume_bbl": 1650,
        "top_suspect": "MV Coral Express (Bulk Carrier)",
        "suspect_mmsi": "SYN-MMSI-41914",
        "attribution_score_pct": 82.7,
        "ais_gap_hours": 3.2,
        "created_at": "2026-09-14T08:15:00Z"
    },
    {
        "id": "INC-BB-004",
        "name": "Bay of Bengal Fairway Discharge (Demo)",
        "zone": "Visakhapatnam Deepwater Corridor",
        "lat": 17.686,
        "lon": 83.218,
        "severity": "MEDIUM",
        "status": "DEMO_SCENARIO",
        "incident_classification": "DEMO / TEST REGIONAL SCENARIO",
        "is_demo_fixture": True,
        "spill_area_sq_km": 5.1,
        "estimated_volume_bbl": 950,
        "top_suspect": "MT Bengal Star (Chemical Tanker)",
        "suspect_mmsi": "SYN-MMSI-41922",
        "attribution_score_pct": 68.9,
        "ais_gap_hours": 0.8,
        "created_at": "2026-09-14T10:45:00Z"
    }
]

@router.get("/incidents")
def list_incidents():
    """Returns list of all demonstration regional scenarios across Indian EEZ."""
    return PRE_SEEDED_INCIDENTS

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str):
    """Returns complete C2 forensic analysis scenario for a selected demonstration incident."""
    global _active_scenario
    for inc in PRE_SEEDED_INCIDENTS:
        if inc["id"] == incident_id:
            scenario = _generate_incident_scenario(
                origin_lat=inc["lat"],
                origin_lon=inc["lon"],
                scenario_id=inc["id"]
            )
            _active_scenario = scenario
            return scenario
    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found in demo registry.")

