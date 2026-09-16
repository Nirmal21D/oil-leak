import sys, os
sys.path.insert(0, os.path.abspath('.'))
import json
from backend.app.services.nga_port_service import NGAPortIndexService

svc = NGAPortIndexService()

print("--- Testing Scene 00111 (Mississippi Canyon: 28.9668, -88.8937) ---")
res_gulf = svc.find_nearest_suitable_port(28.9668, -88.8937, max_radius_km=350.0)
print("Nearest Suitable Port:", json.dumps(res_gulf, indent=2))

print("\n--- Testing Indian EEZ (Mumbai: 19.412, 71.325) ---")
res_ind = svc.find_nearest_suitable_port(19.412, 71.325, max_radius_km=350.0)
print("Nearest Suitable Port:", json.dumps(res_ind, indent=2))
