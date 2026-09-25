import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.services.nga_port_service import NGAPortIndexService
from backend.app.services.responder_routing import CoastGuardResponderRouting

def test_wpi_computation():
    nga_service = NGAPortIndexService()
    routing_service = CoastGuardResponderRouting()
    
    print("=================================================================")
    print("TEST 1: Golden Incident Coordinates (GOM Default Locus)")
    print("Coords: 28.9668° N, 88.8937° W (Gulf of Mexico OCS Sector)")
    print("=================================================================")
    
    res1 = nga_service.discover_candidate_ports(28.9668, -88.8937, max_radius_km=350.0)
    audit1 = res1
    candidates1 = audit1["candidates"]
    
    print(f"WPI FEATURES RETURNED:     {audit1['total_features_returned']}")
    print(f"WITHIN 350 KM:             {audit1['within_radius_count']}")
    print(f"QUALIFYING:                {len(candidates1)}")
    
    distances1 = [c["distance_km"] for c in candidates1]
    is_sorted1 = distances1 == sorted(distances1)
    print(f"SORT:                      {'GEODESIC ASC' if is_sorted1 else 'UNSORTED'} ({[round(d, 1) for d in distances1[:5]]})")
    
    top_cand1 = candidates1[0]
    name1 = top_cand1.get("port_name") or top_cand1.get("main_port_name")
    locode1 = top_cand1.get("un_locode") or top_cand1.get("unlocode")
    print(f"SELECTED:                  {name1} (#{top_cand1['wpi_number']}, {locode1})")
    print(f"SELECTED DISTANCE:         {top_cand1['distance_km']:.1f} km")
    
    # Assertions for Golden Incident
    assert audit1['total_features_returned'] >= 4, "Expected at least 4 WPI features"
    assert is_sorted1, "Candidate list must be sorted in ascending geodesic distance"
    assert "Port Sulphur" in name1, f"Expected Port Sulphur, got {name1}"
    assert abs(top_cand1['distance_km'] - 95.8) < 0.5, f"Expected ~95.8 km, got {top_cand1['distance_km']}"
    
    # Test responder routing wrapper
    route_res1 = routing_service.calculate_intercept_route(28.9668, -88.8937, max_radius_km=350.0)
    assert route_res1["routing_status"] == "GEODESIC_FALLBACK"
    assert route_res1["navigable_distance_km"] is None
    assert route_res1["operational_eta_formatted"] == "NOT ESTABLISHED"
    assert route_res1["selection_basis"] == "Minimum geodesic distance"
    assert abs(route_res1["geodesic_distance_km"] - 95.8) < 0.5
    print(">> Golden Incident Assertions: ALL PASSED!\n")

    print("=================================================================")
    print("TEST 2: Segmented Slick Centroid Coordinates")
    print("Coords: 28.9850° N, 88.9520° W (Centroid of 00111 Observed Slick)")
    print("=================================================================")
    
    res2 = nga_service.discover_candidate_ports(28.9850, -88.9520, max_radius_km=350.0)
    candidates2 = res2["candidates"]
    top_cand2 = candidates2[0]
    name2 = top_cand2.get("port_name") or top_cand2.get("main_port_name")
    print(f"WPI FEATURES RETURNED:     {res2['total_features_returned']}")
    print(f"WITHIN 350 KM:             {res2['within_radius_count']}")
    print(f"SELECTED:                  {name2} (#{top_cand2['wpi_number']})")
    print(f"SELECTED DISTANCE:         {top_cand2['distance_km']:.1f} km")
    # At centroid coordinates, distance is 90.0 km, still Port Sulphur!
    assert "Port Sulphur" in name2
    assert abs(top_cand2['distance_km'] - 90.0) < 0.5
    print(">> Slick Centroid Assertions: ALL PASSED!\n")

    print("=================================================================")
    print("TEST 3: Shifted Incident Coordinates (Western Gulf / Galveston, TX)")
    print("Coords: 29.1000° N, -94.5000° W")
    print("=================================================================")
    
    res3 = nga_service.discover_candidate_ports(29.1000, -94.5000, max_radius_km=350.0)
    candidates3 = res3["candidates"]
    print(f"WPI FEATURES RETURNED:     {res3['total_features_returned']}")
    print(f"WITHIN 350 KM:             {res3['within_radius_count']}")
    
    if candidates3:
        top_cand3 = candidates3[0]
        name3 = top_cand3.get("port_name") or top_cand3.get("main_port_name")
        print(f"SELECTED:                  {name3} (#{top_cand3['wpi_number']})")
        print(f"SELECTED DISTANCE:         {top_cand3['distance_km']:.1f} km")
        # Assert that selected candidate changed and is NOT Port Sulphur!
        assert top_cand3['wpi_number'] != 8830, f"Port should NOT be Port Sulphur when coords moved to Texas! Got {name3}"
        print(f">> Dynamic Spatial Sensitivity Assertion 1: PASSED! Selected port dynamically changed from Port Sulphur to {name3}")
    else:
        print("Candidate list clean")

    print("\n=================================================================")
    print("TEST 4: Shifted Incident Coordinates (Mumbai Offshore / Arabian Sea)")
    print("Coords: 19.4120° N, 71.3250° E")
    print("=================================================================")
    
    res4 = nga_service.discover_candidate_ports(19.4120, 71.3250, max_radius_km=350.0)
    candidates4 = res4["candidates"]
    print(f"WPI FEATURES RETURNED:     {res4['total_features_returned']}")
    print(f"WITHIN 350 KM:             {res4['within_radius_count']}")
    if candidates4:
        top_cand4 = candidates4[0]
        name4 = top_cand4.get("port_name") or top_cand4.get("main_port_name")
        print(f"SELECTED:                  {name4} (#{top_cand4['wpi_number']})")
        print(f"SELECTED DISTANCE:         {top_cand4['distance_km']:.1f} km")
        assert top_cand4['wpi_number'] != 8830
        print(f">> Dynamic Spatial Sensitivity Assertion 2: PASSED! Selected port dynamically resolved to {name4}")

    print("\n=================================================================")
    print("SUMMARY: ALL WPI DYNAMIC COMPUTATION & AUDIT PROOFS PASSED!")
    print("=================================================================")

if __name__ == "__main__":
    test_wpi_computation()
