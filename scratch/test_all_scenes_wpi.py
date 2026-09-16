import sys
import os
import json
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.join(os.path.abspath('.'), 'backend'))
from app.services.nga_port_service import NGAPortIndexService

with open("backend/app/data/nga_wpi_ports.json", "r", encoding="utf-8") as f:
    ports = json.load(f).get("ports", [])

svc = NGAPortIndexService()

test_points = [
    ("Scene 00000 (Cyprus/Levant)", 35.530716, 34.785081),
    ("Scene 00001 (Cyprus/Levant)", 35.408739, 34.993796),
    ("Scene 00002 (Red Sea)", 20.453023, 38.564902),
    ("Scene 00003 (Red Sea)", 20.161569, 38.2182),
    ("Scene 00111 (Gulf of Mexico)", 28.9668, -88.8937),
    ("Mumbai High (India)", 19.412, 71.325)
]

for label, lat, lon in test_points:
    matched = []
    for p in ports:
        plat, plon = p.get("latitude"), p.get("longitude")
        if plat is not None and plon is not None:
            d = svc.haversine_distance_km(plat, plon, lat, lon)
            if d <= 350.0:
                matched.append((d, p))
    matched.sort(key=lambda x: x[0])
    print(f"\n{label} -> {len(matched)} ports found within 350 km")
    if matched:
        nearest = matched[0][1]
        print(f"  Nearest: {nearest.get('wpi_port_name')} ({nearest.get('country')}) @ {round(matched[0][0], 1)} km (WPI #{nearest.get('wpi_port_id')})")
    else:
        print("  NO PORTS FOUND!")
