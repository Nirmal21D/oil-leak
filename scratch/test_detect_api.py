import urllib.request
import urllib.parse
import json

url = "http://127.0.0.1:8000/api/v1/detect"
data = urllib.parse.urlencode({"image_path": "data/02_Test_images_and_ground_truth/Images/Oil/00111.tif"}).encode("utf-8")
req = urllib.request.Request(url, data=data)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        scenario = res.get("scenario_update")
        print("Status code:", resp.status)
        if scenario:
            print("Mode:", scenario.get("is_historical_real"))
            print("Coverage available:", scenario.get("coverage_available"))
            print("AIS status label:", scenario.get("ais_status"))
            print("AIS provenance:", json.dumps(scenario.get("ais_provenance"), indent=2))
            print("Release window:", json.dumps(scenario.get("release_window"), indent=2))
            print("Responder Route (NGA WPI):", json.dumps(scenario.get("responder_route"), indent=2))
            suspects = scenario.get("ranked_suspects", [])
            print(f"Total ranked candidates: {len(suspects)}")
            if suspects:
                top = suspects[0]
                print(f"Top candidate: {top.get('vessel_name')} ({top.get('mmsi')})")
                print(f"Score: {top.get('confidence_score')}%")
                print(f"Priority tier: {top.get('priority_tier')}")
                print(f"Anomaly reasons: {top.get('anomaly_reasons')}")
                print(f"Attribution breakdown: {top.get('attribution_breakdown')}")
        else:
            print("No scenario_update returned!")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
