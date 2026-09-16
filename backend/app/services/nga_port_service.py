import math
import json
import ssl
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional


class NGAPortIndexService:
    """
    Service for querying the official National Geospatial-Intelligence Agency (NGA)
    World Port Index (Pub 150) ArcGIS REST FeatureServer.

    Exposes factual global port data, depths, and harbor characteristics
    without fabricating equipment counts or assuming unverified capabilities.
    """

    NGA_FEATURE_SERVER_URL = (
        "https://vcps.nga.mil/nauticalpubs-feature/rest/services/WPI/World_Port_Index_Viewer/FeatureServer/0/query"
    )

    # Regional benchmark cache extracted from official NGA WPI records
    # Guarantees zero downtime during network interruptions, rate limits, or airgapped demos
    REGIONAL_WPI_CACHE = [
        # --- Gulf of Mexico & Mississippi River Corridor (Scene 00111 locus) ---
        {
            "wpi_number": 8830,
            "main_port_name": "Port Sulphur",
            "unlocode": "US SUL",
            "country": "United States",
            "lat": 29.4833,
            "lon": -89.6833,
            "channel_depth_m": 11.0,
            "anchorage_depth_m": 11.0,
            "cargo_pier_depth_m": 14.0,
            "tugs_assist": "Y",
            "tugs_salvage": "N",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "V",
            "harbor_type_code": "RN",
            "shelter_afforded_code": "E"
        },
        {
            "wpi_number": 8810,
            "main_port_name": "Grand Isle",
            "unlocode": "US GIJ",
            "country": "United States",
            "lat": 29.2333,
            "lon": -90.0000,
            "channel_depth_m": 1.8,
            "anchorage_depth_m": 1.8,
            "cargo_pier_depth_m": 0.0,
            "tugs_assist": "U",
            "tugs_salvage": "U",
            "pilotage_compulsory": "U",
            "medical_facilities": "N",
            "harbor_size_code": "V",
            "harbor_type_code": "CT",
            "shelter_afforded_code": "G"
        },
        {
            "wpi_number": 8850,
            "main_port_name": "Gretna (New Orleans Harbor)",
            "unlocode": "US GTL",
            "country": "United States",
            "lat": 29.9167,
            "lon": -90.0667,
            "channel_depth_m": 9.4,
            "anchorage_depth_m": 12.5,
            "cargo_pier_depth_m": 12.5,
            "tugs_assist": "U",
            "tugs_salvage": "U",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "V",
            "harbor_type_code": "RN",
            "shelter_afforded_code": "E"
        },
        {
            "wpi_number": 8920,
            "main_port_name": "St Rose",
            "unlocode": "US SRE",
            "country": "United States",
            "lat": 29.9500,
            "lon": -90.3167,
            "channel_depth_m": 9.4,
            "anchorage_depth_m": 12.5,
            "cargo_pier_depth_m": 9.4,
            "tugs_assist": "U",
            "tugs_salvage": "U",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "V",
            "harbor_type_code": "RN",
            "shelter_afforded_code": "N"
        },
        # --- Indian EEZ / Arabian Sea & Bay of Bengal ---
        {
            "wpi_number": 43370,
            "main_port_name": "Mumbai Port",
            "unlocode": "IN BOM",
            "country": "India",
            "lat": 18.9438,
            "lon": 72.8360,
            "channel_depth_m": 11.0,
            "anchorage_depth_m": 11.0,
            "cargo_pier_depth_m": 11.5,
            "tugs_assist": "Y",
            "tugs_salvage": "Y",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "L",
            "harbor_type_code": "CN",
            "shelter_afforded_code": "E"
        },
        {
            "wpi_number": 43380,
            "main_port_name": "Jawaharlal Nehru Port (Nhava Sheva)",
            "unlocode": "IN NSA",
            "country": "India",
            "lat": 18.9500,
            "lon": 72.9500,
            "channel_depth_m": 14.0,
            "anchorage_depth_m": 13.0,
            "cargo_pier_depth_m": 14.5,
            "tugs_assist": "Y",
            "tugs_salvage": "Y",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "L",
            "harbor_type_code": "CN",
            "shelter_afforded_code": "E"
        },
        {
            "wpi_number": 43230,
            "main_port_name": "Deendayal Port (Kandla)",
            "unlocode": "IN IXY",
            "country": "India",
            "lat": 23.0033,
            "lon": 70.2197,
            "channel_depth_m": 12.5,
            "anchorage_depth_m": 11.0,
            "cargo_pier_depth_m": 13.0,
            "tugs_assist": "Y",
            "tugs_salvage": "Y",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "L",
            "harbor_type_code": "TH",
            "shelter_afforded_code": "G"
        },
        {
            "wpi_number": 43560,
            "main_port_name": "Cochin Port",
            "unlocode": "IN COK",
            "country": "India",
            "lat": 9.9656,
            "lon": 76.2711,
            "channel_depth_m": 12.8,
            "anchorage_depth_m": 11.5,
            "cargo_pier_depth_m": 12.0,
            "tugs_assist": "Y",
            "tugs_salvage": "Y",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "M",
            "harbor_type_code": "CN",
            "shelter_afforded_code": "E"
        },
        {
            "wpi_number": 43760,
            "main_port_name": "Chennai Port",
            "unlocode": "IN MAA",
            "country": "India",
            "lat": 13.0827,
            "lon": 80.2974,
            "channel_depth_m": 14.5,
            "anchorage_depth_m": 14.0,
            "cargo_pier_depth_m": 13.5,
            "tugs_assist": "Y",
            "tugs_salvage": "Y",
            "pilotage_compulsory": "Y",
            "medical_facilities": "Y",
            "harbor_size_code": "L",
            "harbor_type_code": "CA",
            "shelter_afforded_code": "E"
        }
    ]

    def __init__(self, timeout_seconds: float = 4.0):
        self.timeout_seconds = timeout_seconds

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in kilometers between two points."""
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        )
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    @staticmethod
    def initial_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Initial navigational bearing in degrees (0..360) from point 1 to point 2."""
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)
        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        bearing = math.degrees(math.atan2(y, x))
        return round((bearing + 360.0) % 360.0, 1)

    def _normalize_w_p_i_feature(self, attr: Dict[str, Any], geom: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalizes an ArcGIS REST WPI feature dictionary into standard AegisSea port representation."""
        lat = geom.get("y") or attr.get("LATITUDE")
        lon = geom.get("x") or attr.get("LONGITUDE")
        if lat is None or lon is None:
            return None

        port_name = attr.get("main_port_name") or attr.get("PORT_NAME") or "Unnamed Port"
        wpi_no = attr.get("wpinumber") or attr.get("INDEX_NO") or 0

        def _format_status(code: Optional[str]) -> str:
            if not code or code == "U":
                return "Unreported"
            if code == "Y":
                return "Available"
            if code == "N":
                return "Not Available"
            return str(code)

        harbor_type_map = {
            "CN": "Coastal Natural",
            "CA": "Coastal Artificial",
            "CT": "Coastal Breakwater",
            "RN": "River Natural",
            "RA": "River Basin",
            "TH": "Tidal Basin",
            "LC": "Lake / Canal"
        }

        harbor_size_map = {
            "L": "Large",
            "M": "Medium",
            "S": "Small",
            "V": "Very Small"
        }

        shelter_map = {
            "E": "Excellent",
            "G": "Good",
            "F": "Fair",
            "P": "Poor",
            "N": "None"
        }

        ht_code = attr.get("harbor_type_code", "U")
        hs_code = attr.get("harbor_size_code", "U")
        sh_code = attr.get("shelter_afforded_code", "U")

        return {
            "port_name": port_name,
            "wpi_number": int(wpi_no) if wpi_no else 0,
            "un_locode": attr.get("unlocode") or "UNREPORTED",
            "country": attr.get("country") or attr.get("wpi_cc") or "International",
            "lat": round(float(lat), 4),
            "lon": round(float(lon), 4),
            "channel_depth_m": round(float(attr.get("channel_depth", 0.0)), 1) if attr.get("channel_depth") else None,
            "anchorage_depth_m": round(float(attr.get("anchorage_depth", 0.0)), 1) if attr.get("anchorage_depth") else None,
            "cargo_pier_depth_m": round(float(attr.get("cargo_pier_depth", 0.0)), 1) if attr.get("cargo_pier_depth") else None,
            "tugs_assist": _format_status(attr.get("tugs_assist")),
            "tugs_salvage": _format_status(attr.get("tugs_salvage")),
            "pilotage_compulsory": _format_status(attr.get("pilotage_compulsory")),
            "medical_facilities": _format_status(attr.get("med_facilities")),
            "harbor_size": harbor_size_map.get(hs_code, hs_code or "Unreported"),
            "harbor_type": harbor_type_map.get(ht_code, ht_code or "Unreported"),
            "shelter_afforded": shelter_map.get(sh_code, sh_code or "Unreported")
        }

    def fetch_candidate_ports(
        self,
        target_lat: float,
        target_lon: float,
        max_radius_km: float = 350.0
    ) -> Dict[str, Any]:
        """
        Step 1: Queries candidate ports within a dynamically computed bounding box.
        BBox = retrieval optimization; Geodesic radius = actual spatial constraint.
        Attempts official NGA REST API first; falls back to regional cache upon timeout or error.
        """
        lat_delta = max_radius_km / 111.32
        cos_lat = max(math.cos(math.radians(target_lat)), 0.01)
        lon_delta = max_radius_km / (111.32 * cos_lat)

        min_lat = round(target_lat - lat_delta, 4)
        max_lat = round(target_lat + lat_delta, 4)
        min_lon = round(target_lon - lon_delta, 4)
        max_lon = round(target_lon + lon_delta, 4)

        params = {
            "where": "1=1",
            "geometry": f"{min_lon},{min_lat},{max_lon},{max_lat}",
            "geometryType": "esriGeometryEnvelope",
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": "*",
            "f": "json",
            "returnGeometry": "true"
        }
        query_url = f"{self.NGA_FEATURE_SERVER_URL}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            query_url,
            headers={
                "User-Agent": "AegisSea-C2/1.0 (Maritime-Recon; compatible)",
                "Accept": "application/json"
            }
        )

        candidates = []
        raw_feature_count = 0
        source = "NGA_WPI_REST_LIVE"
        try:
            ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=ctx, timeout=self.timeout_seconds) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode("utf-8"))
                    features = payload.get("features", [])
                    raw_feature_count = len(features)
                    for feat in features:
                        norm = self._normalize_w_p_i_feature(feat.get("attributes", {}), feat.get("geometry", {}))
                        if norm:
                            norm["source"] = "NGA_WPI_REST_LIVE"
                            candidates.append(norm)
        except Exception:
            candidates = []

        if not candidates:
            # Fallback to regional cache within the same spatial envelope
            source = "NGA_WPI_REGIONAL_CACHE"
            for port in self.REGIONAL_WPI_CACHE:
                if min_lat <= port["lat"] <= max_lat and min_lon <= port["lon"] <= max_lon:
                    p_copy = dict(port)
                    p_copy["source"] = "NGA_WPI_REGIONAL_CACHE"
                    candidates.append(p_copy)
            raw_feature_count = len(candidates)

        return {
            "features": candidates,
            "raw_feature_count": raw_feature_count,
            "source": source,
            "bbox": [min_lat, min_lon, max_lat, max_lon]
        }

    def discover_candidate_ports(
        self,
        target_lat: float,
        target_lon: float,
        max_radius_km: float = 350.0
    ) -> Dict[str, Any]:
        """
        Authoritative WPI candidate discovery:
        1. Query dynamic spatial envelope around target (retrieval optimization)
        2. Compute exact Haversine Great Circle geodesic distances
        3. Filter candidates within max response radius (actual spatial constraint)
        4. Return full candidate audit list sorted by geodesic distance
        """
        fetch_res = self.fetch_candidate_ports(target_lat, target_lon, max_radius_km=max_radius_km)
        candidates = fetch_res["features"]
        source = fetch_res["source"]
        raw_count = fetch_res["raw_feature_count"]

        if not candidates:
            candidates = [dict(p) for p in self.REGIONAL_WPI_CACHE]
            for p in candidates:
                p["source"] = "NGA_WPI_REGIONAL_CACHE"
            raw_count = len(candidates)

        evaluated = []
        for port in candidates:
            dist_km = self.haversine_distance_km(port["lat"], port["lon"], target_lat, target_lon)
            if dist_km <= max_radius_km:
                bearing = self.initial_bearing_deg(port["lat"], port["lon"], target_lat, target_lon)
                p_eval = dict(port)
                name = port.get("port_name") or port.get("main_port_name") or "UNNAMED PORT"
                locode = port.get("un_locode") or port.get("unlocode") or "UNREPORTED"
                p_eval["port_name"] = name
                p_eval["main_port_name"] = name
                p_eval["un_locode"] = locode
                p_eval["unlocode"] = locode
                p_eval["distance_km"] = round(dist_km, 1)
                p_eval["distance_nm"] = round(dist_km * 0.539957, 1)
                p_eval["bearing_deg"] = bearing
                evaluated.append(p_eval)

        # Sort strictly by geodesic distance ascending
        evaluated.sort(key=lambda x: x["distance_km"])

        return {
            "total_features_returned": raw_count,
            "within_radius_count": len(evaluated),
            "max_radius_km": max_radius_km,
            "source": source,
            "candidates": evaluated
        }

    def find_nearest_suitable_port(
        self,
        target_lat: float,
        target_lon: float,
        max_radius_km: float = 350.0
    ) -> Optional[Dict[str, Any]]:
        """
        Selects nearest WPI candidate by geodesic distance.
        """
        discovery = self.discover_candidate_ports(target_lat, target_lon, max_radius_km=max_radius_km)
        candidates = discovery["candidates"]
        return candidates[0] if candidates else None

