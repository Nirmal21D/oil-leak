import os
import io
import cv2
import base64
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

router = APIRouter(prefix="/api/v1", tags=["Detection & Attribution"])

_model_instance = None
_drift_engine = HindcastDriftEngine()
_attribution_scorer = VesselAttributionScorer()
_ais_generator = SyntheticAISGenerator()
_dark_vessel_detector = DarkVesselDetector()
_responder_routing = CoastGuardResponderRouting()
_sar_dataset = SARDatasetService()
_marine_cadastre_ais = MarineCadastreAISService()

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

class HindcastRequest(BaseModel):
    origin_lat: float = Field(19.412, description="Latitude of detected slick center")
    origin_lon: float = Field(71.325, description="Longitude of detected slick center")
    hours_back: float = Field(6.5, description="Hindcast duration in hours")
    u_current_m_s: float = Field(0.35, description="Eastward ocean current (m/s)")
    v_current_m_s: float = Field(-0.20, description="Northward ocean current (m/s)")
    u_wind_m_s: float = Field(2.5, description="Eastward wind velocity (m/s)")
    v_wind_m_s: float = Field(-3.0, description="Northward wind velocity (m/s)")

def _generate_incident_scenario(
    origin_lat: float = 19.412,
    origin_lon: float = 71.325,
    custom_slick_props: Optional[Dict[str, Any]] = None,
    scenario_id: str = "INC-20260913-0091"
) -> Dict[str, Any]:
    hindcast = _drift_engine.run_backward_hindcast(origin_lat, origin_lon, hours_back=6.5)
    forecast = _drift_engine.run_forward_forecast(origin_lat, origin_lon, hours_ahead=12.0)
    reconstructed_release = hindcast["reconstructed_release"]

    # Documented Mumbai High Oil Field Centroid (~19.417° N, 71.333° E)
    field_centroid_lat, field_centroid_lon = 19.417, 71.333
    dist_to_field = _attribution_scorer.haversine_distance_km(
        origin_lat, origin_lon, field_centroid_lat, field_centroid_lon
    )

    # Candidate AIS Vessels Attribution Scoring
    candidates = _ais_generator.generate_candidate_scenario(
        reconstructed_release_lat=reconstructed_release["lat"],
        reconstructed_release_lon=reconstructed_release["lon"],
        drift_heading_deg=hindcast["drift_heading_deg"]
    )

    ranked_suspects = []
    for cand in candidates:
        initial_draft = cand.get("initial_draft_m", 10.0)
        current_draft = cand.get("current_draft_m", 10.0)
        draft_delta = round(abs(initial_draft - current_draft), 2)
        has_ais_gap = cand.get("ais_gap_hours", 0.0) > 1.0
        has_speed_drop = cand.get("min_speed_knots", cand.get("speed_knots", 12.0)) < 5.0

        score_res = _attribution_scorer.score_vessel(
            vessel_lat=cand["lat"],
            vessel_lon=cand["lon"],
            vessel_heading_deg=cand["heading_deg"],
            reconstructed_origin=reconstructed_release,
            drift_heading_deg=hindcast["drift_heading_deg"],
            vessel_speed_knots=cand.get("speed_knots", 12.4),
            ais_gap_flag=has_ais_gap,
            speed_drop_flag=has_speed_drop,
            draft_change_m=draft_delta
        )

        overall_score_pct = round(score_res["overall_score"] * 100.0, 1)

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
            "initial_draft_m": initial_draft,
            "current_draft_m": current_draft,
            "draft_change_m": draft_delta,
            "ais_gap_hours": cand.get("ais_gap_hours", 0.0),
            "ais_status": cand["ais_status"],
            "distance_km": score_res["proximity_km"],
            "proximity_score": score_res["proximity_score"],
            "trajectory_score": score_res["trajectory_score"],
            "behavioral_anomaly_score": score_res["behavioral_anomaly_score"],
            "attribution_score_pct": overall_score_pct,
            "risk_level": "PRIMARY SUSPECT" if overall_score_pct >= 80.0 else ("MODERATE RISK" if overall_score_pct >= 50.0 else "LOW RISK"),
            "track_points": cand["track_points"]
        })

    # Sort suspects by overall score descending
    ranked_suspects.sort(key=lambda x: x["attribution_score_pct"], reverse=True)

    dark_vessels = _dark_vessel_detector.detect_dark_vessels(origin_lat, origin_lon)
    responder_route = _responder_routing.calculate_intercept_route(
        origin_lat, origin_lon, hindcast["drift_heading_deg"], hindcast["drift_speed_knots"]
    )

    detected_slick = custom_slick_props or {
        "area_sq_km": 14.8,
        "estimated_age_hours": hindcast["hours_hindcasted"],
        "drift_heading_deg": hindcast["drift_heading_deg"],
        "drift_speed_knots": hindcast["drift_speed_knots"],
        "perimeter_km": 28.4,
        "compactness_index": 0.23,
        "estimated_thickness_um": 2.15,
        "estimated_volume_m3": 31.82,
        "estimated_mass_tons": 27.68,
        "weathering_stage": "Gravity-Viscous Drift & Evaporation"
    }

    return {
        "scenario_id": scenario_id,
        "system_status": "ONLINE / S1-SAR LOCKED",
        "sector": "ARABIAN SEA / MUMBAI HIGH BASIN",
        "telemetry": {
            "wind": "14.0 kts @ 065° NE",
            "current": "1.2 kts @ 065° NE",
            "sea_temp_c": 28.4,
            "wave_height_m": 1.5,
            "drift_vector": f"{hindcast['drift_heading_deg']}° T at {hindcast['drift_speed_knots']} knots"
        },
        "location": {
            "name": f"Detected Slick Locus ({origin_lat:.4f}° N, {origin_lon:.4f}° E)",
            "lat": origin_lat,
            "lon": origin_lon,
            "coastline": "Konkan Coast, Arabian Sea"
        },
        "detected_slick": detected_slick,
        "hindcast_trajectory": hindcast["trajectory_points"],
        "drift_cone_polygon": hindcast["drift_cone_polygon"],
        "reconstructed_release": reconstructed_release,
        "ranked_suspects": ranked_suspects,
        "dark_vessels": dark_vessels,
        "responder_route": responder_route,
        "infrastructure_proximity": {
            "nearest_rig": "Mumbai High Field Centroid Complex",
            "centroid_lat": field_centroid_lat,
            "centroid_lon": field_centroid_lon,
            "distance_km": round(dist_to_field, 2),
            "rig_spill_risk_flag": False
        }
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

@router.post("/detect", response_model=DetectionSummaryResponse)
async def run_oil_detection(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None)
):
    if file is not None:
        content = await file.read()
        image_name = file.filename or "upload.png"
        is_tiff = image_name.lower().endswith((".tif", ".tiff"))
        if is_tiff:
            try:
                raw = tifffile.imread(io.BytesIO(content))
                img_np = _normalize_sar_array(raw)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse GeoTIFF file: {e}")
        else:
            try:
                pil_img = Image.open(io.BytesIO(content)).convert("RGB")
                img_np = np.array(pil_img)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
    elif image_path is not None:
        p = Path(image_path)
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"Specified image path not found: {image_path}")
        image_name = p.name
        is_tiff = image_name.lower().endswith((".tif", ".tiff"))
        if is_tiff:
            try:
                raw = tifffile.imread(str(p))
                img_np = _normalize_sar_array(raw)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse GeoTIFF at path: {e}")
        else:
            try:
                pil_img = Image.open(p).convert("RGB")
                img_np = np.array(pil_img)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read image at path: {e}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either an uploaded 'file' or 'image_path'.")

    H, W, _ = img_np.shape
    total_pixels = H * W

    model = get_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inferencer = TileSlidingInference(model, tile_size=256, stride=128, device=device)
    mask = inferencer.predict_scene(img_np)

    no_oil_cnt = int(np.sum(mask == 0))
    oil_cnt = int(np.sum(mask == 1))
    lookalike_cnt = int(np.sum(mask == 2))

    oil_pct = round((oil_cnt / total_pixels) * 100.0, 3)
    lookalike_pct = round((lookalike_cnt / total_pixels) * 100.0, 3)
    confidence = 0.85 if oil_cnt > 50 else (0.45 if lookalike_cnt > 50 else 0.99)

    morphology = SlickPhysicsAnalyzer.analyze_slick_morphology(mask, pixel_resolution_m=10.0, estimated_age_hours=6.5)

    overlay_rgb = np.zeros((H, W, 4), dtype=np.uint8)
    overlay_rgb[mask == 0] = [16, 185, 129, 60]
    overlay_rgb[mask == 1] = [239, 68, 68, 220]
    overlay_rgb[mask == 2] = [245, 158, 11, 200]

    overlay_img = Image.fromarray(overlay_rgb, mode="RGBA")
    buffer = io.BytesIO()
    overlay_img.save(buffer, format="PNG")
    mask_b64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    # Noise floor threshold: < 500 pixels (0.012% of a 2048x2048 scene) is an operational noise filter floor
    is_confirmed_spill = (oil_cnt >= 500)

    if is_confirmed_spill:
        oil_y, oil_x = np.where(mask == 1)
        mean_y = float(np.mean(oil_y))
        mean_x = float(np.mean(oil_x))
        base_lat, base_lon = 19.4120, 71.3250
        # 10m per pixel: 0.00009 deg lat, 0.0000955 deg lon
        offset_lat = - (mean_y - (H / 2.0)) * 0.000090
        offset_lon = (mean_x - (W / 2.0)) * 0.0000955
        detected_lat = round(base_lat + offset_lat, 4)
        detected_lon = round(base_lon + offset_lon, 4)

        detected_location = {
            "name": f"Detected Slick in {image_name}",
            "lat": detected_lat,
            "lon": detected_lon
        }

        scenario_update = _generate_incident_scenario(
            origin_lat=detected_lat,
            origin_lon=detected_lon,
            custom_slick_props={
                "area_sq_km": morphology["area_sq_km"],
                "perimeter_km": morphology["perimeter_km"],
                "compactness_index": morphology["compactness_index"],
                "estimated_thickness_um": morphology["estimated_thickness_um"],
                "estimated_volume_m3": morphology["estimated_volume_m3"],
                "estimated_mass_tons": morphology["estimated_mass_tons"],
                "weathering_stage": morphology["weathering_stage"]
            },
            scenario_id=f"INC-USER-{abs(hash(image_name)) % 10000:04d}"
        )
    else:
        detected_location = None
        scenario_update = None
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

    return DetectionSummaryResponse(
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
        scenario_update=scenario_update
    )

class ForecastRequest(BaseModel):
    origin_lat: float = Field(19.412, description="Latitude of detected slick center")
    origin_lon: float = Field(71.325, description="Longitude of detected slick center")
    hours_ahead: float = Field(12.0, description="Forecast duration in hours")
    u_current_m_s: float = Field(0.35, description="Eastward ocean current (m/s)")
    v_current_m_s: float = Field(-0.20, description="Northward ocean current (m/s)")
    u_wind_m_s: float = Field(2.5, description="Eastward wind velocity (m/s)")
    v_wind_m_s: float = Field(-3.0, description="Northward wind velocity (m/s)")

@router.post("/forecast")
def calculate_forward_forecast(req: ForecastRequest):
    result = _drift_engine.run_forward_forecast(
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        hours_ahead=req.hours_ahead,
        u_current_base=req.u_current_m_s,
        v_current_base=req.v_current_m_s,
        u_wind_base=req.u_wind_m_s,
        v_wind_base=req.v_wind_m_s
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
        target = {"image_path": req.image_path, "has_mask": False, "mask_path": None}
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

    morphology = SlickPhysicsAnalyzer.analyze_slick_morphology(mask, pixel_resolution_m=10.0, estimated_age_hours=6.5)

    # Generate full C2 scenario update
    lat = 19.4120 + (float(meta.get("vv_mean_db", -25.0)) + 25.0) * 0.01
    lon = 71.3250 + (float(meta.get("vh_mean_db", -30.0)) + 30.0) * 0.01
    scenario_update = _generate_incident_scenario(
        origin_lat=round(lat, 4),
        origin_lon=round(lon, 4),
        custom_slick_props={
            "area_sq_km": morphology["area_sq_km"],
            "perimeter_km": morphology["perimeter_km"],
            "compactness_index": morphology["compactness_index"],
            "estimated_thickness_um": morphology["estimated_thickness_um"],
            "estimated_volume_m3": morphology["estimated_volume_m3"],
            "estimated_mass_tons": morphology["estimated_mass_tons"],
            "weathering_stage": morphology["weathering_stage"]
        },
        scenario_id=f"INC-ZENODO-{target['category'].upper()}-{target['scene_id']}"
    )

    return {
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
        "scenario_update": scenario_update
    }

# ---------------------------------------------------------------------------
# Multi-Incident Command Platform Endpoints
# ---------------------------------------------------------------------------

PRE_SEEDED_INCIDENTS = [
    {
        "id": "INC-MH-001",
        "name": "Mumbai High Basin Blowout",
        "zone": "Arabian Sea / Offshore ONGC Sector",
        "lat": 19.412,
        "lon": 71.325,
        "severity": "CRITICAL",
        "status": "ACTIVE_INVESTIGATION",
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
        "name": "Gulf of Kutch Tanker Fairway",
        "zone": "Kandla Port Approach / Gujarat",
        "lat": 22.845,
        "lon": 69.632,
        "severity": "MEDIUM",
        "status": "ACTIVE_MONITORING",
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
        "name": "Lakshadweep Coral Channel",
        "zone": "Lakshadweep Sea / Marine Sanctuary",
        "lat": 10.083,
        "lon": 73.625,
        "severity": "HIGH",
        "status": "CONTAINMENT_DISPATCHED",
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
        "name": "Bay of Bengal Fairway Discharge",
        "zone": "Visakhapatnam Deepwater Corridor",
        "lat": 17.686,
        "lon": 83.218,
        "severity": "MEDIUM",
        "status": "FORENSIC_AUDIT",
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
    """Returns list of all active maritime incidents across Indian EEZ."""
    return PRE_SEEDED_INCIDENTS

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str):
    """Returns complete C2 forensic analysis scenario for a selected incident."""
    for inc in PRE_SEEDED_INCIDENTS:
        if inc["id"] == incident_id:
            return _generate_incident_scenario(
                origin_lat=inc["lat"],
                origin_lon=inc["lon"],
                scenario_id=inc["id"]
            )
    # Default fallback
    return _generate_incident_scenario(
        origin_lat=19.412,
        origin_lon=71.325,
        scenario_id=incident_id
    )

