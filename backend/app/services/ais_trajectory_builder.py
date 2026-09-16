from datetime import datetime
from typing import List, Dict, Any, Optional
import math


class AISTrajectoryBuilder:
    """
    Reconstructs chronological vessel trajectories from normalized AIS pings.
    Calculates trajectory-derived operational features:
    - Speed variations & open-water loitering / slow transit
    - Course changes and turning maneuvers
    - AIS transponder blackout gaps (loss of transmission)
    - Full track coordinates formatted for Leaflet tactical map rendering
    """

    def __init__(self, blackout_threshold_hours: float = 1.0):
        self.blackout_threshold_hours = blackout_threshold_hours

    def build_trajectories(self, pings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups pings by MMSI and builds chronological trajectories.
        """
        by_mmsi: Dict[str, List[Dict[str, Any]]] = {}
        for p in pings:
            m = p["mmsi"]
            if m not in by_mmsi:
                by_mmsi[m] = []
            by_mmsi[m].append(p)

        trajectories = []
        for mmsi, m_pings in by_mmsi.items():
            # Sort chronologically
            m_pings.sort(key=lambda x: x["timestamp"])

            first_p = m_pings[0]
            last_p = m_pings[-1]
            v_name = first_p.get("vessel_name") or f"VESSEL-{mmsi[-4:]}"
            v_type = first_p.get("vessel_type") or "Commercial Vessel"
            v_type_code = first_p.get("vessel_type_code", 0)
            imo = first_p.get("imo", "IMO-UNREPORTED")

            speeds = [p["sog"] for p in m_pings]
            headings = [p["heading"] for p in m_pings]

            min_speed = min(speeds) if speeds else 0.0
            max_speed = max(speeds) if speeds else 0.0
            avg_speed = round(sum(speeds) / len(speeds), 1) if speeds else 0.0

            # 1. Detect transmission blackout gaps
            max_gap_hours = 0.0
            gap_intervals = []
            for i in range(len(m_pings) - 1):
                t1 = m_pings[i]["timestamp"]
                t2 = m_pings[i + 1]["timestamp"]
                gap_sec = (t2 - t1).total_seconds()
                gap_h = gap_sec / 3600.0
                if gap_h > max_gap_hours:
                    max_gap_hours = gap_h
                if gap_h >= self.blackout_threshold_hours:
                    gap_intervals.append({
                        "from": t1.isoformat() + "Z",
                        "to": t2.isoformat() + "Z",
                        "gap_hours": round(gap_h, 2)
                    })

            # 2. Detect course changes in fairway
            max_course_change_deg = 0.0
            for i in range(len(m_pings) - 1):
                c1 = m_pings[i]["cog"]
                c2 = m_pings[i + 1]["cog"]
                diff = abs(c2 - c1)
                if diff > 180.0:
                    diff = 360.0 - diff
                if diff > max_course_change_deg:
                    max_course_change_deg = diff

            # 3. Detect loitering / uncharacteristic stops in open sea
            loitering_count = sum(1 for s in speeds if s < 3.0)
            is_loitering = (loitering_count / len(speeds)) > 0.40 if speeds else False

            # Simplified track coordinates for Leaflet tactical map rendering
            track_points = [
                {
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "timestamp": p["timestamp_iso"],
                    "sog": p["sog"],
                    "cog": p["cog"]
                }
                for p in m_pings
            ]

            trajectories.append({
                "mmsi": mmsi,
                "vessel_name": v_name,
                "vessel_type": v_type,
                "vessel_type_code": v_type_code,
                "imo": imo,
                "flag": "United States" if mmsi.startswith("36") else "International",
                "total_pings": len(m_pings),
                "first_seen_utc": first_p["timestamp_iso"],
                "last_seen_utc": last_p["timestamp_iso"],
                "min_sog_knots": min_speed,
                "max_sog_knots": max_speed,
                "avg_sog_knots": avg_speed,
                "latest_lat": last_p["lat"],
                "latest_lon": last_p["lon"],
                "latest_heading": last_p["heading"],
                "latest_sog": last_p["sog"],
                "max_gap_hours": round(max_gap_hours, 2),
                "gap_intervals": gap_intervals,
                "has_ais_gap": max_gap_hours >= self.blackout_threshold_hours,
                "max_course_change_deg": round(max_course_change_deg, 1),
                "is_loitering": is_loitering,
                "track_points": track_points,
                "detailed_pings": track_points
            })

        return trajectories
