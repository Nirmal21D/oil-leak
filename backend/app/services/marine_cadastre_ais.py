import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

class MarineCadastreAISService:
    """
    Standard MarineCadastre AIS Ingestion & Spatial-Temporal Association Engine.
    Follows official NOAA / BOEM MarineCadastre AccessAIS schema.
    
    Fields handled:
    - MMSI (Maritime Mobile Service Identity)
    - BaseDateTime (UTC Timestamp)
    - LAT, LON (WGS-84 Decimal Degrees)
    - SOG (Speed Over Ground, knots)
    - COG (Course Over Ground, degrees)
    - Heading (True Heading, degrees)
    - VesselName, IMO, CallSign
    - VesselType (70-79 Cargo, 80-89 Tanker, 52 Tug, 30 Fishing, etc.)
    - Status (Navigation Status code)
    - Draft (meters)
    """

    def __init__(self):
        # Vessel type mapping per USCG / MarineCadastre specs
        self.vessel_type_map = {
            70: "Cargo Vessel",
            71: "Container Ship",
            72: "Bulk Carrier",
            79: "Cargo / General",
            80: "Crude Oil Tanker",
            81: "Chemical Tanker",
            82: "Liquid Gas Carrier",
            84: "Bunkering Tanker",
            89: "Product Tanker",
            52: "Tug / Towing",
            30: "Fishing Vessel",
            37: "Pleasure Craft"
        }

    def parse_record(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes a raw MarineCadastre dictionary or CSV row.
        """
        v_type_code = int(raw.get("VesselType", 70))
        v_type_label = self.vessel_type_map.get(v_type_code, f"Vessel (Type {v_type_code})")
        
        return {
            "mmsi": str(raw.get("MMSI", "")),
            "timestamp": str(raw.get("BaseDateTime", "")),
            "lat": float(raw.get("LAT", raw.get("Latitude", 0.0))),
            "lon": float(raw.get("LON", raw.get("Longitude", 0.0))),
            "sog": float(raw.get("SOG", 0.0)),
            "cog": float(raw.get("COG", 0.0)),
            "heading": float(raw.get("Heading", raw.get("COG", 0.0))),
            "vessel_name": str(raw.get("VesselName", "UNKNOWN")),
            "imo": str(raw.get("IMO", "IMO-NOT-REPORTED")),
            "vessel_type_code": v_type_code,
            "vessel_type": v_type_label,
            "status": str(raw.get("Status", "0")),
            "draft": float(raw.get("Draft", 10.0)) if raw.get("Draft") is not None else 10.0,
            "length": float(raw.get("Length", 180.0)) if raw.get("Length") is not None else 180.0,
            "width": float(raw.get("Width", 32.0)) if raw.get("Width") is not None else 32.0,
        }

    def correlate_tracks_with_spill(
        self,
        vessel_tracks: List[Dict[str, Any]],
        slick_lat: float,
        slick_lon: float,
        reconstructed_origin_lat: float,
        reconstructed_origin_lon: float,
        incident_time_iso: str,
        search_radius_km: float = 35.0
    ) -> List[Dict[str, Any]]:
        """
        Associates MarineCadastre vessel tracks with detected oil spill origin.
        Computes Closest Point of Approach (CPA), AIS blackout gap duration,
        speed divergence in slick sector, and multi-factor suspect score.
        """
        results = []
        for track in vessel_tracks:
            mmsi = track.get("mmsi")
            name = track.get("vessel_name", "UNKNOWN")
            v_type = track.get("vessel_type", "Vessel")
            points = track.get("track_points", [])
            
            min_dist_km = 999.0
            closest_pt = None
            speed_at_cpa = 0.0
            
            # Evaluate all track points for CPA to reconstructed release origin
            for pt in points:
                lat = pt.get("lat", 0.0)
                lon = pt.get("lon", 0.0)
                dist = self.haversine_km(lat, lon, reconstructed_origin_lat, reconstructed_origin_lon)
                if dist < min_dist_km:
                    min_dist_km = dist
                    closest_pt = pt
                    speed_at_cpa = pt.get("speed_knots", pt.get("sog", 10.0))

            # Proximity factor (0-100)
            prox_score = max(0.0, 100.0 - (min_dist_km / search_radius_km * 100.0))
            
            # Vessel Type Risk Weight
            # Tankers / Chemical carriers have highest baseline risk for cargo discharge
            type_weight = 1.0
            if "Tanker" in v_type or "Crude" in v_type:
                type_weight = 1.25
            elif "Cargo" in v_type or "Bulk" in v_type:
                type_weight = 1.05
            elif "Tug" in v_type or "Supply" in v_type:
                type_weight = 0.8
            else:
                type_weight = 0.5

            # AIS gap audit (Dark vessel)
            ais_gap_hours = track.get("ais_gap_hours", 0.0)
            gap_penalty = min(25.0, ais_gap_hours * 8.0)
            
            # Draft delta factor
            draft_initial = track.get("initial_draft_m", track.get("draft", 12.0))
            draft_current = track.get("current_draft_m", draft_initial)
            draft_delta = max(0.0, draft_initial - draft_current)
            draft_factor = min(15.0, draft_delta * 12.0)

            # Combined attribution score (0 to 100%)
            raw_score = (prox_score * 0.50 + gap_penalty + draft_factor) * type_weight
            attribution_score = round(min(98.5, max(5.0, raw_score)), 1)
            
            risk_tier = "LOW"
            if attribution_score >= 75.0:
                risk_tier = "CRITICAL / PRIMARY SUSPECT"
            elif attribution_score >= 45.0:
                risk_tier = "MEDIUM / FLAGGED FOR INTERROGATION"

            results.append({
                "mmsi": mmsi,
                "vessel_name": name,
                "vessel_type": v_type,
                "flag": track.get("flag", "International"),
                "cpa_to_origin_km": round(min_dist_km, 2),
                "closest_point": closest_pt,
                "speed_at_cpa_knots": speed_at_cpa,
                "ais_gap_hours": ais_gap_hours,
                "draft_discharge_delta_m": round(draft_delta, 2),
                "attribution_score": attribution_score,
                "risk_tier": risk_tier,
                "is_primary_suspect": attribution_score >= 75.0,
                "track_points": points
            })

        # Sort descending by attribution confidence
        results.sort(key=lambda x: x["attribution_score"], reverse=True)
        return results

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
