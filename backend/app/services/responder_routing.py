import math
from typing import Dict, Any, List

class CoastGuardResponderRouting:
    """
    Geodesic Intercept Vector & ETA Calculator (Feature F13 Concept):
    Computes direct open-water Haversine distance, transit speed (22 knots), time-to-intercept (ETA),
    and containment boom deployment coordinates for Coast Guard responder vessels.
    
    DISCLOSURE:
    - This is a geodesic (Haversine) speed-distance-time vector calculation.
    - It is a direct open-water line calculation, not a graph-search A* pathfinder with landmass obstacle avoidance.
    """

    MUMBAI_PORT_STATION = {
        "station_name": "Indian Coast Guard District HQ 2 (Mumbai Port Base)",
        "asset_name": "ICG Pollution Control Vessel (Demonstration Asset)",
        "lat": 18.9438,
        "lon": 72.8360,
        "max_speed_knots": 22.0
    }

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def calculate_intercept_route(
        self,
        slick_lat: float = 19.412,
        slick_lon: float = 71.325,
        drift_heading_deg: float = 124.3,
        drift_speed_knots: float = 1.0
    ) -> Dict[str, Any]:
        """
        Computes optimal intercept vector from Mumbai Port station to drifting slick boundary edge.
        """
        station_lat = self.MUMBAI_PORT_STATION["lat"]
        station_lon = self.MUMBAI_PORT_STATION["lon"]

        dist_km = self.haversine_distance_km(station_lat, station_lon, slick_lat, slick_lon)
        dist_nm = dist_km * 0.539957

        speed_knots = self.MUMBAI_PORT_STATION["max_speed_knots"]
        time_to_intercept_hrs = dist_nm / speed_knots

        # Intercept point coordinates (projected forward by drift)
        rad = math.radians(drift_heading_deg)
        drift_dist_m = (drift_speed_knots * 0.514444) * (time_to_intercept_hrs * 3600.0)
        
        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * math.cos(math.radians(slick_lat)))

        intercept_lat = round(slick_lat + (math.cos(rad) * drift_dist_m * lat_per_m), 5)
        intercept_lon = round(slick_lon + (math.sin(rad) * drift_dist_m * lon_per_m), 5)

        # Route waypoints line (Station -> Intercept Point)
        waypoints = [
            {"name": self.MUMBAI_PORT_STATION["station_name"], "lat": station_lat, "lon": station_lon},
            {"name": "Midway Operational Vector", "lat": round((station_lat + intercept_lat)/2.0, 5), "lon": round((station_lon + intercept_lon)/2.0, 5)},
            {"name": "Slick Intercept & Boom Deployment Zone", "lat": intercept_lat, "lon": intercept_lon}
        ]

        return {
            "responder_asset": self.MUMBAI_PORT_STATION["asset_name"],
            "station_base": self.MUMBAI_PORT_STATION["station_name"],
            "transit_speed_knots": speed_knots,
            "distance_km": round(dist_km, 2),
            "distance_nm": round(dist_nm, 2),
            "eta_hours": round(time_to_intercept_hrs, 2),
            "eta_formatted": f"T+{round(time_to_intercept_hrs, 1)}h (ETA ~{round(time_to_intercept_hrs*60)} mins)",
            "intercept_point": {"lat": intercept_lat, "lon": intercept_lon},
            "boom_strategy": "2000m Heavy-Duty Offshore Skimming Boom Deployment",
            "coastal_protection_target": "Konkan Mangrove Estuary & Raigad Marine Sanctuary",
            "waypoints": waypoints
        }

if __name__ == "__main__":
    routing = CoastGuardResponderRouting()
    res = routing.calculate_intercept_route()
    print("Coast Guard Intercept Vector Output:", res)
