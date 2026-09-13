import os
import io
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image
import torch

from backend.app.config import settings
from backend.app.models.unet_detector import load_detector_model, TileSlidingInference
from backend.app.services.drift_engine import HindcastDriftEngine, VesselAttributionScorer
from backend.app.services.slick_physics import SlickPhysicsAnalyzer
from backend.app.services.ais_generator import SyntheticAISGenerator
from backend.app.services.dark_vessel_detector import DarkVesselDetector
from backend.app.services.responder_routing import CoastGuardResponderRouting

router = APIRouter(prefix="/api/v1", tags=["Detection & Attribution"])

_model_instance = None
_drift_engine = HindcastDriftEngine()
_attribution_scorer = VesselAttributionScorer()
_ais_generator = SyntheticAISGenerator()
_dark_vessel_detector = DarkVesselDetector()
_responder_routing = CoastGuardResponderRouting()

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
        try:
            pil_img = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
    elif image_path is not None:
        p = Path(image_path)
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"Specified image path not found: {image_path}")
        image_name = p.name
        try:
            pil_img = Image.open(p).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read image at path: {e}")
    else:
        raise HTTPException(status_code=400, detail="Must provide either an uploaded 'file' or 'image_path'.")

    img_np = np.array(pil_img)
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

    # Calculate real geospatial centroid from detected oil pixels
    if oil_cnt > 0:
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
        detected_location = {
            "name": f"Clean Sea in {image_name}",
            "lat": 19.4120,
            "lon": 71.3250
        }
        scenario_update = _generate_incident_scenario(
            origin_lat=19.4120,
            origin_lon=71.3250,
            custom_slick_props=morphology,
            scenario_id=f"INC-CLEAR-{abs(hash(image_name)) % 10000:04d}"
        )

    return DetectionSummaryResponse(
        status="success",
        image_name=image_name,
        width=W,
        height=H,
        total_pixels=total_pixels,
        oil_pixel_count=oil_cnt,
        lookalike_pixel_count=lookalike_cnt,
        no_oil_pixel_count=no_oil_cnt,
        oil_coverage_pct=oil_pct,
        lookalike_coverage_pct=lookalike_pct,
        confidence_score=confidence,
        classes_detected={
            "oil_spill": oil_cnt > 0,
            "lookalike": lookalike_cnt > 0,
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
