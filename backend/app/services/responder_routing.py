"""
CoastGuardResponderRouting — WPI Candidate Discovery & Response Routing.

ARCHITECTURAL PRINCIPLE:
No maritime route geometry, navigable distance, or operational ETA may be generated
unless derived from an authoritative routing/waterway source.
When no authoritative maritime routing engine is registered, the system strictly
implements GEODESIC_FALLBACK: geodesic straight-line distance is computed as a reference,
navigable distance is NOT ESTABLISHED, and operational ETA is NOT ESTABLISHED.
"""

import math
from typing import Dict, Any, List, Optional
from backend.app.services.nga_port_service import NGAPortIndexService


class CoastGuardResponderRouting:
    """
    WPI Candidate Discovery & Multi-Stage Response Routing.

    Pipeline:
    1. WPI Candidate Discovery (dynamic envelope query & 350 km geodesic radius)
    2. Geodesic Candidate Filter (N = 10-20 candidate pool)
    3. Maritime Route Evaluation (checks registered authoritative maritime routing provider)
    4. Response Port Selection (minimum navigable distance if routed, or minimum geodesic distance in fallback)
    """

    DEFAULT_TRANSIT_SPEED_KNOTS = 22.0
    MAX_RESPONSE_RADIUS_KM = 350.0

    def __init__(self, maritime_routing_provider=None):
        self.port_service = NGAPortIndexService(timeout_seconds=4.0)
        self.maritime_routing_provider = maritime_routing_provider

    def calculate_intercept_route(
        self,
        slick_lat: float = 19.412,
        slick_lon: float = 71.325,
        drift_heading_deg: float = 124.3,
        drift_speed_knots: float = 1.0,
        max_radius_km: float = 350.0
    ) -> Dict[str, Any]:
        """
        Executes WPI Candidate Discovery, Route Evaluation, and Response Port Selection.
        """
        # Step 1: WPI Candidate Discovery & Step 2: Geodesic Candidate Filter
        discovery = self.port_service.discover_candidate_ports(slick_lat, slick_lon, max_radius_km=max_radius_km)
        candidates = discovery.get("candidates", [])
        raw_count = discovery.get("total_features_returned", 0)
        within_radius_count = discovery.get("within_radius_count", 0)
        source_tag = discovery.get("source", "NGA_WPI_REST_LIVE")

        if not candidates:
            return {
                "routing_status": "ROUTING_UNAVAILABLE",
                "status_label": "ROUTING UNAVAILABLE",
                "response_hub": "PORT DATA UNAVAILABLE",
                "station_base": "PORT DATA UNAVAILABLE",
                "station_coords": [slick_lat, slick_lon],
                "selection_basis": "No candidates found within response radius",
                "maritime_access": "Unavailable",
                "geodesic_distance_km": 0.0,
                "navigable_distance_km": None,
                "operational_eta_formatted": "NOT ESTABLISHED",
                "selected_port": None,
                "candidate_audit": {
                    "total_features_returned": raw_count,
                    "within_radius_count": 0,
                    "max_radius_km": max_radius_km,
                    "candidates": []
                },
                "waypoints": []
            }

        # Step 3: Maritime Route Evaluation
        # If an authoritative maritime routing provider is registered, route top N candidates (N=10-20)
        top_n = min(len(candidates), 15)
        candidate_pool = candidates[:top_n]

        selected_port = None
        routing_status = "GEODESIC_FALLBACK"
        navigable_dist_km = None
        navigable_eta_hours = None
        route_geometry = []
        provider_name = "NONE REGISTERED"
        provider_reason = "NO AUTHORITATIVE MARITIME ROUTING SOURCE"

        if self.maritime_routing_provider is not None:
            # Evaluate real maritime routes if provider is available
            best_nav_dist = float("inf")
            for cand in candidate_pool:
                try:
                    route_eval = self.maritime_routing_provider.calculate_route(
                        origin=(cand["lat"], cand["lon"]),
                        destination=(slick_lat, slick_lon)
                    )
                    if route_eval and route_eval.get("navigable_distance_km"):
                        d = route_eval["navigable_distance_km"]
                        cand["navigable_distance_km"] = d
                        if d < best_nav_dist:
                            best_nav_dist = d
                            selected_port = cand
                            navigable_dist_km = d
                            navigable_eta_hours = route_eval.get("eta_hours")
                            route_geometry = route_eval.get("geometry", [])
                            routing_status = "MARITIME_ROUTE_AVAILABLE"
                            provider_name = getattr(self.maritime_routing_provider, "name", "REGISTERED_MARITIME_ROUTER")
                            provider_reason = "NAVIGABLE ROUTE ESTABLISHED"
                except Exception:
                    continue

        # Step 4: Response Port Selection
        # If routing unavailable, select the nearest WPI candidate by geodesic distance and label result GEODESIC_FALLBACK
        if selected_port is None:
            selected_port = candidates[0]
            routing_status = "GEODESIC_FALLBACK"
            provider_name = "NONE REGISTERED"
            provider_reason = "NO AUTHORITATIVE MARITIME ROUTING SOURCE"
            selection_basis = "Minimum geodesic distance"
            maritime_access = "Not evaluated"
        else:
            selection_basis = "Minimum navigable water distance"
            maritime_access = "Evaluated"

        station_name = selected_port.get("main_port_name") or selected_port.get("port_name", "Nearest Port")
        station_lat = selected_port["lat"]
        station_lon = selected_port["lon"]
        wpi_num = selected_port.get("wpi_number", 0)
        un_locode = selected_port.get("unlocode") or selected_port.get("un_locode", "UNREPORTED")
        country = selected_port.get("country", "International")
        geodesic_km = selected_port.get("distance_km", 0.0)
        geodesic_nm = selected_port.get("distance_nm", round(geodesic_km * 0.539957, 1))
        bearing = selected_port.get("bearing_deg", 0.0)

        # Mark selected candidate in the audit list
        candidate_audit_list = []
        for i, c in enumerate(candidates):
            c_copy = dict(c)
            c_copy["rank"] = i + 1
            c_copy["is_selected"] = (
                (c.get("wpi_number") and c.get("wpi_number") == wpi_num and c.get("main_port_name") == station_name)
                or (c.get("main_port_name") == station_name and i == 0)
                or (routing_status == "GEODESIC_FALLBACK" and i == 0)
            )
            candidate_audit_list.append(c_copy)

        # Build authoritative selected port identity object consumed by Tactical C2 UI
        selected_port_obj = {
            "port_name": station_name,
            "main_port_name": station_name,
            "wpi_number": wpi_num,
            "un_locode": un_locode,
            "unlocode": un_locode,
            "country": country,
            "lat": station_lat,
            "lon": station_lon,
            "geodesic_distance_km": geodesic_km,
            "geodesic_distance_nm": geodesic_nm,
            "distance_km": geodesic_km,
            "distance_nm": geodesic_nm,
            "bearing_deg": bearing,
            "channel_depth_m": selected_port.get("channel_depth_m"),
            "anchorage_depth_m": selected_port.get("anchorage_depth_m"),
            "cargo_pier_depth_m": selected_port.get("cargo_pier_depth_m"),
            "harbor_size": selected_port.get("harbor_size", "Unreported"),
            "harbor_type": selected_port.get("harbor_type", "Unreported"),
            "shelter_afforded": selected_port.get("shelter_afforded", "Unreported"),
            "source": source_tag
        }

        # Project drift intercept zone locus
        rad = math.radians(drift_heading_deg)
        time_assumption_hrs = geodesic_nm / max(self.DEFAULT_TRANSIT_SPEED_KNOTS, 1.0)
        drift_dist_m = (drift_speed_knots * 0.514444) * (time_assumption_hrs * 3600.0)
        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * max(math.cos(math.radians(slick_lat)), 1e-4))
        intercept_lat = round(slick_lat + (math.cos(rad) * drift_dist_m * lat_per_m), 5)
        intercept_lon = round(slick_lon + (math.sin(rad) * drift_dist_m * lon_per_m), 5)

        # Geodesic reference vector waypoints (distinct from navigable route)
        geodesic_reference_vector = [
            {"name": f"{station_name} (WPI #{wpi_num})", "lat": station_lat, "lon": station_lon},
            {"name": "Geodesic Intercept Reference Point", "lat": intercept_lat, "lon": intercept_lon}
        ]

        return {
            "routing_status": routing_status,
            "status_label": "GEODESIC FALLBACK" if routing_status == "GEODESIC_FALLBACK" else "MARITIME ROUTE AVAILABLE",
            "routing_provider": provider_name,
            "routing_reason": provider_reason,
            "selection_basis": selection_basis,
            "maritime_access": maritime_access,
            "selected_port": selected_port_obj,
            "response_hub": station_name,
            "station_base": station_name,
            "station_country": country,
            "station_coords": [station_lat, station_lon],
            "wpi_number": wpi_num,
            "un_locode": un_locode,
            "nga_registry_ref": f"NGA Pub 150 WPI #{wpi_num} ({un_locode})",
            "source": source_tag,
            "transit_speed_knots": self.DEFAULT_TRANSIT_SPEED_KNOTS,
            "geodesic_distance_km": geodesic_km,
            "geodesic_distance_nm": geodesic_nm,
            "distance_km": geodesic_km,
            "distance_nm": geodesic_nm,
            "bearing_deg": bearing,
            "navigable_distance_km": navigable_dist_km,
            "navigable_distance_nm": round(navigable_dist_km * 0.539957, 1) if navigable_dist_km else None,
            "operational_eta_formatted": f"T+{round(navigable_eta_hours, 1)}h" if navigable_eta_hours else "NOT ESTABLISHED",
            "eta_hours": round(navigable_eta_hours, 2) if navigable_eta_hours else None,
            "eta_formatted": "NOT ESTABLISHED (GEODESIC FALLBACK)",
            "intercept_point": {"lat": intercept_lat, "lon": intercept_lon},
            "wpi_attributes": {
                "channel_depth_m": selected_port.get("channel_depth_m"),
                "anchorage_depth_m": selected_port.get("anchorage_depth_m"),
                "cargo_pier_depth_m": selected_port.get("cargo_pier_depth_m"),
                "tugs_assist": selected_port.get("tugs_assist", "Unreported"),
                "tugs_salvage": selected_port.get("tugs_salvage", "Unreported"),
                "pilotage_compulsory": selected_port.get("pilotage_compulsory", "Unreported"),
                "medical_facilities": selected_port.get("medical_facilities", "Unreported"),
                "harbor_size": selected_port.get("harbor_size", "Unreported"),
                "harbor_type": selected_port.get("harbor_type", "Unreported"),
                "shelter_afforded": selected_port.get("shelter_afforded", "Unreported")
            },
            "candidate_audit": {
                "total_features_returned": raw_count,
                "within_radius_count": within_radius_count,
                "max_radius_km": max_radius_km,
                "candidates": candidate_audit_list
            },
            "provenance": {
                "dataset": "National Geospatial-Intelligence Agency (NGA) World Port Index (Pub 150)",
                "service": "ArcGIS REST FeatureServer / NGA Maritime Safety Office",
                "selection_method": "Geodesic Candidate Filter & WPI Infrastructure Discovery",
                "routing_provider": provider_name,
                "routing_status": routing_status
            },
            "operational_caveat": (
                "The WPI query establishes a geographically suitable port candidate based on available WPI attributes. "
                "Because no authoritative maritime routing source is registered, navigable water route and operational ETA "
                "are NOT ESTABLISHED. The straight-line distance is provided strictly as a geodesic reference."
            ),
            "geodesic_reference_vector": geodesic_reference_vector,
            "navigable_route_geometry": route_geometry,
            "waypoints": geodesic_reference_vector
        }


if __name__ == "__main__":
    routing = CoastGuardResponderRouting()
    res_gulf = routing.calculate_intercept_route(28.9668, -88.8937)
    print("Source:", res_gulf["source"])
    print("WPI Attributes:", res_gulf["wpi_attributes"])
    res_mumbai = routing.calculate_intercept_route(19.412, 71.325)
    print("Mumbai Scene:", res_mumbai["response_hub"], f"({res_mumbai['distance_km']} km, WPI #{res_mumbai['wpi_number']})")
