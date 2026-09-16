import os
import csv
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple


class BaseAISProvider(ABC):
    """
    Abstract Base Class for AIS Data Providers.
    Allows AegisSea to ingest from MarineCadastre, Spire, exactEarth,
    or local historical archives without coupling to downstream attribution.
    """

    @abstractmethod
    def query_vessels(
        self,
        bbox: Tuple[float, float, float, float], # (min_lat, min_lon, max_lat, max_lon)
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, Any]:
        """
        Query raw AIS pings within the spatial envelope and time window.
        Returns a dict with 'pings' list and 'provenance' metadata.
        """
        pass


class MarineCadastreAISProvider(BaseAISProvider):
    """
    Ingests and normalizes official NOAA / BOEM MarineCadastre AIS records.
    Supports reading from local partitioned CSV archives or streaming caches.
    """

    VESSEL_TYPE_MAP = {
        0: "Not Available / Default",
        30: "Fishing Vessel",
        31: "Tug / Towing Vessel",
        32: "Tug / Towing Vessel",
        36: "Sailing Vessel",
        37: "Pleasure Craft",
        52: "Tug / Towing Vessel",
        60: "Passenger / Crew Supply",
        61: "Passenger / Ferry",
        69: "High-Speed Craft",
        70: "Cargo Vessel",
        71: "Container Ship",
        72: "Bulk Carrier",
        79: "General Cargo",
        80: "Crude Oil Tanker",
        81: "Chemical Tanker",
        82: "Liquid Gas Carrier",
        84: "Bunkering Tanker",
        89: "Product Tanker",
        90: "Offshore Support / Special Craft"
    }

    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            # Default to repo data/historical_ais
            base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/historical_ais"))
            self.data_dir = base_path
        else:
            self.data_dir = data_dir

    def _normalize_row(self, row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            mmsi = str(row.get("MMSI", "")).strip()
            if not mmsi or mmsi == "0":
                return None

            dt_str = row.get("BaseDateTime", "").strip()
            # Handle ISO string (e.g. 2018-04-22T18:00:00)
            if "T" in dt_str:
                dt = datetime.fromisoformat(dt_str)
            else:
                dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")

            lat = float(row.get("LAT", row.get("Latitude", 0.0)))
            lon = float(row.get("LON", row.get("Longitude", 0.0)))
            sog = float(row.get("SOG", row.get("Speed", 0.0)))
            cog = float(row.get("COG", row.get("Course", 0.0)))
            heading = float(row.get("Heading", cog))
            if heading == 511.0 or heading < 0: # 511 indicates heading not available in AIS spec
                heading = cog

            v_type_raw = row.get("VesselType", "0")
            try:
                v_type_code = int(v_type_raw)
            except (ValueError, TypeError):
                v_type_code = 0
            v_type_label = self.VESSEL_TYPE_MAP.get(v_type_code, f"Commercial Vessel (Type {v_type_code})")

            v_name = str(row.get("VesselName", "")).strip() or f"VESSEL-{mmsi[-4:]}"
            imo = str(row.get("IMO", "")).strip()
            callsign = str(row.get("CallSign", "")).strip()
            length = float(row.get("Length", 0.0)) if row.get("Length") else None
            width = float(row.get("Width", 0.0)) if row.get("Width") else None
            draft = float(row.get("Draft", 0.0)) if row.get("Draft") else None

            return {
                "mmsi": mmsi,
                "timestamp": dt,
                "timestamp_iso": dt.isoformat() + "Z",
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "sog": round(sog, 1),
                "cog": round(cog, 1),
                "heading": round(heading, 1),
                "vessel_name": v_name,
                "vessel_type_code": v_type_code,
                "vessel_type": v_type_label,
                "imo": imo if imo and imo != "0" else "IMO-UNREPORTED",
                "callsign": callsign,
                "length": length,
                "width": width,
                "draft": draft
            }
        except Exception:
            return None

    def query_vessels(
        self,
        bbox: Tuple[float, float, float, float], # min_lat, min_lon, max_lat, max_lon
        start_time: datetime,
        end_time: datetime,
        scene_hint: Optional[str] = "00111"
    ) -> Dict[str, Any]:
        """
        Finds matching AIS records from the historical archive directory.
        """
        min_lat, min_lon, max_lat, max_lon = bbox
        pings = []
        raw_files_scanned = []

        # Find matching CSV archive files in data_dir
        if os.path.exists(self.data_dir):
            for fname in os.listdir(self.data_dir):
                if fname.endswith(".csv"):
                    fpath = os.path.join(self.data_dir, fname)
                    raw_files_scanned.append(fname)
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        reader = csv.DictReader(f)
                        for r in reader:
                            norm = self._normalize_row(r)
                            if not norm:
                                continue
                            if (min_lat <= norm["lat"] <= max_lat and
                                min_lon <= norm["lon"] <= max_lon and
                                start_time <= norm["timestamp"] <= end_time):
                                pings.append(norm)

        unique_mmsis = set(p["mmsi"] for p in pings)

        provenance = {
            "provider": "NOAA / BOEM MarineCadastre AccessAIS",
            "archive_files": raw_files_scanned,
            "query_window_utc": f"{start_time.isoformat()}Z to {end_time.isoformat()}Z",
            "bounding_box": [min_lat, min_lon, max_lat, max_lon],
            "raw_pings_scanned": len(pings),
            "unique_vessels_tracked": len(unique_mmsis),
            "coverage_status": "HISTORICAL_ARCHIVE_VERIFIED" if len(pings) > 0 else "NO_RECORDS_IN_WINDOW"
        }

        return {
            "pings": pings,
            "provenance": provenance
        }
