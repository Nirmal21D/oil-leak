import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl._create_unverified_context()
url = 'https://vcps.nga.mil/nauticalpubs-feature/rest/services/WPI/World_Port_Index_Viewer/FeatureServer?f=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
    data = json.loads(r.read().decode('utf-8'))
    print("FeatureServer Title:", data.get("name") or data.get("serviceDescription")[:60])
    print("Layers:")
    for l in data.get("layers", []):
        print(f"  Layer ID: {l.get('id')} -> {l.get('name')}")
