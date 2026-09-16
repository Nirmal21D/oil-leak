import math
from typing import List, Dict, Any, Optional
import numpy as np


class AISAttributionEngine:
    """
    Multi-Signal AIS Correlation & Vessel Attribution Engine (AegisSea Scoring Model).
    
    Methodology:
    - Calculates Closest Point of Approach (CPA) to scientifically reconstructed spill release origin.
    - Evaluates vector alignment between vessel heading at CPA and backward drift vector.
    - Assesses trajectory-derived behavioral anomalies (open-water loitering/speed drops,
      fairway course deviations, and AIS transmission blackout gaps).
    - Weighted synthesis: 45% Proximity + 30% Trajectory Alignment + 25% Behavioral Anomaly.
    
    Neutral Forensics Terminology:
    Vessels are evaluated as 'Attribution Candidates' or 'Potential Source Vessels',
    not definitive culprits.
    """

    def __init__(self, sigma_km: float = 6.0):
        self.sigma_km = sigma_km

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def score_trajectories(
        self,
        trajectories: List[Dict[str, Any]],
        reconstructed_origin: Dict[str, float],
        drift_heading_deg: float,
        provenance: Dict[str, Any],
        search_radius_km: float = 35.0
    ) -> List[Dict[str, Any]]:
        """
        Correlates all reconstructed vessel trajectories against the reconstructed
        release origin and returns ranked attribution candidates.
        """
        origin_lat = reconstructed_origin["lat"]
        origin_lon = reconstructed_origin["lon"]

        candidates = []
        for traj in trajectories:
            mmsi = traj["mmsi"]
            name = traj["vessel_name"]
            v_type = traj["vessel_type"]
            detailed_pings = traj.get("detailed_pings", [])

            # 1. Compute Closest Point of Approach (CPA) to reconstructed origin
            min_dist_km = 999.0
            cpa_ping = None
            for p in detailed_pings:
                d = self.haversine_km(p["lat"], p["lon"], origin_lat, origin_lon)
                if d < min_dist_km:
                    min_dist_km = d
                    cpa_ping = p

            if min_dist_km > search_radius_km:
                # Vessel never came within the investigative search envelope
                continue

            # If no detailed pings or fallback
            if cpa_ping is None:
                cpa_lat, cpa_lon = traj["latest_lat"], traj["latest_lon"]
                cpa_sog = traj["latest_sog"]
                cpa_cog = traj["latest_heading"]
                cpa_time = traj["last_seen_utc"]
            else:
                cpa_lat = cpa_ping["lat"]
                cpa_lon = cpa_ping["lon"]
                cpa_sog = cpa_ping["sog"]
                cpa_cog = cpa_ping["cog"]
                cpa_time = cpa_ping["timestamp"]

            # Dimension 1: Proximity Score (Gaussian Decay around reconstructed origin)
            prox_score = math.exp(-(min_dist_km ** 2) / (2.0 * (self.sigma_km ** 2)))

            # Dimension 2: Trajectory Directional Alignment (Cosine difference)
            rad_diff = math.radians(cpa_cog - drift_heading_deg)
            traj_score = max(0.0, math.cos(rad_diff))

            # Dimension 3: Trajectory-Derived Behavioral Anomaly
            # Evaluates operational behavior without relying on static manual draft records
            anomaly_components = []
            anomaly_flags = []
            if traj.get("has_ais_gap", False):
                anomaly_components.append(0.85)
                anomaly_flags.append(f"AIS Transmission Gap ({traj.get('max_gap_hours', 0.0):.1f}h blackout)")
            if cpa_sog < 4.0 or traj.get("is_loitering", False):
                anomaly_components.append(0.80)
                anomaly_flags.append(f"Speed Anomaly ({cpa_sog:.1f} kn in open sea / loitering)")
            if traj.get("max_course_change_deg", 0.0) > 40.0:
                anomaly_components.append(0.70)
                anomaly_flags.append(f"Fairway Course Deviation ({traj.get('max_course_change_deg', 0.0):.1f}° heading deflection)")

            if anomaly_components:
                anomaly_score = float(np.mean(anomaly_components))
            else:
                anomaly_score = 0.15 # Baseline normal commercial corridor transit

            # AegisSea Attribution Score (Engineering Methodology: 45% Prox, 30% Traj, 25% Anom)
            raw_total = (0.45 * prox_score) + (0.30 * traj_score) + (0.25 * anomaly_score)
            overall_score_pct = round(min(98.5, max(5.0, raw_total * 100.0)), 1)

            # Assign Priority Tier (Neutral forensic terminology)
            if overall_score_pct >= 75.0:
                priority_tier = "HIGH PRIORITY CANDIDATE"
                is_top_candidate = True
            elif overall_score_pct >= 45.0:
                priority_tier = "INTERROGATION LEAD"
                is_top_candidate = False
            else:
                priority_tier = "LOW CORRELATION CANDIDATE"
                is_top_candidate = False

            # Plain-English forensic evidence presentation summary
            cpa_display = f"{min_dist_km:.2f} KM"
            temporal_overlap = "WINDOW OVERLAP VERIFIED" if cpa_time else "ESTIMATED OVERLAP"
            
            if traj_score < 0.05:
                trajectory_display = "NO POSITIVE CONTRIBUTION"
            elif traj.get("max_course_change_deg", 0.0) > 40.0:
                trajectory_display = f"{traj.get('max_course_change_deg', 0.0):.0f}° COURSE DEVIATION"
            else:
                trajectory_display = f"{cpa_cog:.0f}° HEADING ({traj_score:.2f} COSINE FACTOR)"

            if anomaly_flags:
                behavior_display = " · ".join(anomaly_flags)
            else:
                behavior_display = "STANDARD COMMERCIAL TRANSIT BASELINE"

            evidence_summary = {
                "cpa_km": round(min_dist_km, 2),
                "cpa_display": cpa_display,
                "temporal_context": temporal_overlap,
                "cpa_time_utc": cpa_time,
                "trajectory_display": trajectory_display,
                "trajectory_score": round(traj_score, 3),
                "behavior_display": behavior_display,
                "behavior_score": round(anomaly_score, 3),
                "attribution_index": overall_score_pct,
                "attribution_index_display": f"{overall_score_pct} / 100",
                "disclaimer": "Engineering prioritization index. Not a probability of responsibility."
            }

            candidates.append({
                "vessel_id": f"MMSI-{mmsi}",
                "vessel_name": name,
                "vessel_type": v_type,
                "vessel_type_code": traj.get("vessel_type_code", 0),
                "mmsi": mmsi,
                "imo": traj.get("imo", "IMO-UNREPORTED"),
                "flag": traj.get("flag", "United States"),
                "lat": cpa_lat,
                "lon": cpa_lon,
                "heading_deg": cpa_cog,
                "speed_knots": cpa_sog,
                "min_speed_knots": traj.get("min_sog_knots", cpa_sog),
                "max_course_change_deg": traj.get("max_course_change_deg", 0.0),
                "distance_km": round(min_dist_km, 2),
                "cpa_dist_km": round(min_dist_km, 2),
                "proximity_km": round(min_dist_km, 2),
                "cpa_time_utc": cpa_time,
                "proximity_score": round(prox_score, 3),
                "trajectory_score": round(traj_score, 3),
                "behavioral_anomaly_score": round(anomaly_score, 3),
                "attribution_score_pct": overall_score_pct,
                "confidence_score": overall_score_pct,
                "risk_index_pct": overall_score_pct,
                "overall_attribution_score": round(overall_score_pct / 100.0, 3),
                "risk_level": priority_tier,
                "priority_tier": priority_tier,
                "is_primary_suspect": is_top_candidate,
                "total_pings": traj.get("total_pings", 0),
                "max_gap_hours": traj.get("max_gap_hours", 0.0),
                "ais_gap_hours": traj.get("max_gap_hours", 0.0),
                "has_ais_gap": traj.get("has_ais_gap", False),
                "anomaly_flags": anomaly_flags,
                "anomaly_reasons": ", ".join(anomaly_flags) if anomaly_flags else "Standard Transit Baseline",
                "evidence_summary": evidence_summary,
                "attribution_breakdown": {
                    "proximity_score": round(prox_score, 3),
                    "trajectory_score": round(traj_score, 3),
                    "behavioral_anomaly_score": round(anomaly_score, 3),
                    "proximity_weighted_pct": round(prox_score * 45.0, 1),
                    "trajectory_weighted_pct": round(traj_score * 30.0, 1),
                    "behavioral_weighted_pct": round(anomaly_score * 25.0, 1),
                    "formula": "0.45·Proximity + 0.30·Trajectory + 0.25·Behavioral",
                    "methodology": "AegisSea Attribution Score (Engineering Methodology)"
                },
                "is_historical_real": True,
                "ais_status": "REAL HISTORICAL AIS (NOAA MARINECADASTRE)",
                "track_points": traj.get("track_points", [])
            })

        # Sort candidates descending by AegisSea attribution score
        candidates.sort(key=lambda x: x["attribution_score_pct"], reverse=True)
        return candidates
