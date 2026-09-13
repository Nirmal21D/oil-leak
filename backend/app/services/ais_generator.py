import math
from typing import List, Dict, Any

class SyntheticAISGenerator:
    """
    Synthetic AIS Vessel Traffic & Track Generator for Mumbai High AOI:
    Generates realistic candidate vessel tracks using explicit synthetic identifiers (SYN-AIS-XXXX)
    to eliminate any risk of collision with real-world registered vessel IMO numbers.
    """

    def generate_candidate_scenario(
        self,
        reconstructed_release_lat: float = 19.47326,
        reconstructed_release_lon: float = 71.20966,
        drift_heading_deg: float = 124.3
    ) -> List[Dict[str, Any]]:
        """
        Returns candidate vessels with historical track polylines around reconstructed release origin.
        """
        # Candidate 1: High-risk suspect passing within ~1.8 km of reconstructed release origin
        cand_1_lat = round(reconstructed_release_lat + 0.012, 5)
        cand_1_lon = round(reconstructed_release_lon - 0.011, 5)
        cand_1_heading = 126.5 # Strongly aligned with spill drift vector (124.3 deg)
        
        # Candidate 2: Medium-risk container vessel passing ~6.4 km away
        cand_2_lat = round(reconstructed_release_lat - 0.045, 5)
        cand_2_lon = round(reconstructed_release_lon + 0.038, 5)
        cand_2_heading = 195.0 # Divergent course
        
        # Candidate 3: Low-risk offshore supply vessel stationed at platform zone (~12.1 km away)
        cand_3_lat = round(reconstructed_release_lat - 0.082, 5)
        cand_3_lon = round(reconstructed_release_lon - 0.075, 5)
        cand_3_heading = 45.0

        candidates = [
            {
                "vessel_id": "SYN-AIS-9482",
                "vessel_name": "MT Ocean Pioneer",
                "vessel_type": "Crude Oil Tanker",
                "flag": "Panama",
                "mmsi": "SYN-MMSI-41901",
                "lat": cand_1_lat,
                "lon": cand_1_lon,
                "heading_deg": cand_1_heading,
                "speed_knots": 12.4,
                "min_speed_knots": 3.8, # Speed drop in release origin window
                "initial_draft_m": 14.2, # Laden tanker draft prior to transit
                "current_draft_m": 13.4, # Post-transit draft indicating 0.8m ballast/cargo delta
                "ais_gap_hours": 2.4,   # 2.4-hour AIS transponder gap near spill origin
                "ais_status": "Intermittent Gap (2.4h Blackout Logged)",
                "track_points": self._build_track_polyline(cand_1_lat, cand_1_lon, cand_1_heading, 12.4)
            },
            {
                "vessel_id": "SYN-AIS-7104",
                "vessel_name": "MV Arabian Trader",
                "vessel_type": "Container Ship",
                "flag": "Liberia",
                "mmsi": "SYN-MMSI-41902",
                "lat": cand_2_lat,
                "lon": cand_2_lon,
                "heading_deg": cand_2_heading,
                "speed_knots": 15.1,
                "min_speed_knots": 14.8, # Constant commercial transit speed
                "initial_draft_m": 11.5,
                "current_draft_m": 11.5, # Zero draft change
                "ais_gap_hours": 0.0,   # Continuous AIS transmission
                "ais_status": "Nominal Continuous Broadcast",
                "track_points": self._build_track_polyline(cand_2_lat, cand_2_lon, cand_2_heading, 15.1)
            },
            {
                "vessel_id": "SYN-AIS-3829",
                "vessel_name": "MT Gulf Stream",
                "vessel_type": "Chemical Tanker",
                "flag": "India",
                "mmsi": "SYN-MMSI-41903",
                "lat": cand_3_lat,
                "lon": cand_3_lon,
                "heading_deg": cand_3_heading,
                "speed_knots": 9.2,
                "min_speed_knots": 8.9,
                "initial_draft_m": 8.2,
                "current_draft_m": 8.2,  # Zero draft change
                "ais_gap_hours": 0.0,   # Continuous AIS transmission
                "ais_status": "Nominal Continuous Broadcast",
                "track_points": self._build_track_polyline(cand_3_lat, cand_3_lon, cand_3_heading, 9.2)
            }
        ]

        return candidates

    def _build_track_polyline(
        self, 
        current_lat: float, 
        current_lon: float, 
        heading_deg: float, 
        speed_knots: float,
        num_hours_back: float = 6.0
    ) -> List[Dict[str, float]]:
        """Generates 5 historical position waypoints along vessel course."""
        track = []
        speed_m_s = speed_knots * 0.514444
        rad = math.radians(heading_deg)
        
        # Unit direction vectors
        u_dir = math.sin(rad) # Eastward component
        v_dir = math.cos(rad) # Northward component
        
        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * math.cos(math.radians(current_lat)))

        for step in range(6):
            hours_ago = (5 - step) * 1.2 # Waypoints every 1.2 hours
            dist_m = speed_m_s * (hours_ago * 3600.0)
            
            p_lat = round(current_lat - (v_dir * dist_m * lat_per_m), 5)
            p_lon = round(current_lon - (u_dir * dist_m * lon_per_m), 5)
            
            track.append({
                "hours_ago": hours_ago,
                "lat": p_lat,
                "lon": p_lon
            })

        return track

if __name__ == "__main__":
    gen = SyntheticAISGenerator()
    scen = gen.generate_candidate_scenario()
    print(f"Generated {len(scen)} synthetic candidate vessel tracks.")
    for v in scen:
        print(f" - [{v['vessel_id']}] {v['vessel_name']} ({v['vessel_type']}) at ({v['lat']}, {v['lon']})")
