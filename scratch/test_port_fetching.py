import sys
import os
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.join(os.path.abspath('.'), 'backend'))
import tifffile
from app.services.sar_dataset_service import SARDatasetService
from app.services.geospatial_service import GeospatialService
from app.services.nga_port_service import NGAPortIndexService
from app.services.responder_routing import CoastGuardResponderRouting

ds = SARDatasetService()
scenes = ds.list_available_scenes()
oil_scenes = scenes.get('oil', [])
port_svc = NGAPortIndexService()
router = CoastGuardResponderRouting()

print(f"Total oil scenes: {len(oil_scenes)}")
for s in oil_scenes[:8]:
    try:
        with tifffile.TiffFile(s['image_path']) as tif:
            geo = GeospatialService.extract_georeferencing(tif)
            center = geo.get('scene_center')
            print(f"\n--- Scene {s['scene_id']} ({s['filename']}) ---")
            print(f"  Georeferenced: {geo.get('georeferenced')} | Center: {center}")
            if center:
                route = router.calculate_intercept_route(center['lat'], center['lon'])
                print(f"  Routing Status: {route.get('routing_status')}")
                print(f"  Response Hub:   {route.get('response_hub')}")
                print(f"  Geodesic Dist:  {route.get('geodesic_distance_km')} km")
                print(f"  Candidates Ct:  {len(route.get('candidate_audit', {}).get('candidates', []))}")
                if route.get('routing_status') == 'ROUTING_UNAVAILABLE':
                    print("  *** TRIGGERED ROUTING_UNAVAILABLE! ***")
    except Exception as e:
        print(f"Error on {s['scene_id']}: {e}")
