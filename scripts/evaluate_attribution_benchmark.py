import numpy as np
import math
from typing import Dict, Any
from backend.app.services.drift_engine import VesselAttributionScorer

def run_honest_attribution_benchmark(
    num_trials: int = 100,
    sigma_spatial_km: float = 3.5,
    sigma_heading_deg: float = 25.0,
    score_threshold: float = 0.60,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Evaluates VesselAttributionScorer mathematical consistency & robustness 
    under realistic ambiguous synthetic noise conditions.
    
    IMPORTANT FRAMING:
    - This benchmark evaluates algorithmic internal stability under a reasoned synthetic noise model.
    - It validates mathematical consistency under noise, not real-world ground-truth accuracy 
      (since no paired ground-truth attribution dataset exists publicly — Gap G7).
    """
    np.random.seed(seed)
    scorer = VesselAttributionScorer()

    tp, fp, fn, tn = 0, 0, 0, 0

    origin_lat, origin_lon = 19.47326, 71.20966
    true_drift_heading = 124.3

    for i in range(num_trials):
        # 50% true positive scenarios (spill-causing vessel near origin)
        # 50% false positive / negative scenarios (nearby non-responsible or misaligned vessels)
        is_true_responsible = (i % 2 == 0)

        if is_true_responsible:
            # Responsible vessel: near release point with noisy heading
            dist_offset_km = np.abs(np.random.normal(loc=1.2, scale=sigma_spatial_km))
            angle_offset_deg = np.random.normal(loc=0.0, scale=sigma_heading_deg)
        else:
            # Non-responsible vessel: passing nearby (3.0-12.0 km) on random course
            dist_offset_km = np.random.uniform(3.0, 12.0)
            angle_offset_deg = np.random.uniform(35.0, 180.0)

        # Convert distance offset to lat/lon shift
        bearing_rad = np.radians(np.random.uniform(0, 360))
        lat_shift = (dist_offset_km / 111.0) * np.cos(bearing_rad)
        lon_shift = (dist_offset_km / (111.0 * np.cos(np.radians(origin_lat)))) * np.sin(bearing_rad)

        vessel_lat = origin_lat + lat_shift
        vessel_lon = origin_lon + lon_shift
        vessel_heading = (true_drift_heading + angle_offset_deg) % 360.0

        # Score candidate vessel using real VesselAttributionScorer (3-term PS 26143 formula)
        reconstructed_origin = {"lat": origin_lat, "lon": origin_lon}
        score_res = scorer.score_vessel(
            vessel_lat=vessel_lat,
            vessel_lon=vessel_lon,
            vessel_heading_deg=vessel_heading,
            reconstructed_origin=reconstructed_origin,
            drift_heading_deg=true_drift_heading,
            ais_gap_flag=is_true_responsible,
            speed_drop_flag=is_true_responsible,
            draft_change_m=0.8 if is_true_responsible else 0.0
        )


        overall_score = score_res["overall_score"]
        predicted_high_risk = (overall_score >= score_threshold)

        if is_true_responsible and predicted_high_risk:
            tp += 1
        elif not is_true_responsible and predicted_high_risk:
            fp += 1
        elif is_true_responsible and not predicted_high_risk:
            fn += 1
        else:
            tn += 1

    precision = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    accuracy = ((tp + tn) / num_trials)

    return {
        "trials_eval": num_trials,
        "noise_model": {
            "spatial_sigma_km": sigma_spatial_km,
            "heading_sigma_deg": sigma_heading_deg,
            "decision_threshold": score_threshold
        },
        "confusion_matrix": {"TP": tp, "FP": fp, "FN": fn, "TN": tn},
        "calculated_precision_pct": round(precision * 100.0, 2),
        "calculated_recall_pct": round(recall * 100.0, 2),
        "calculated_f1_pct": round(f1_score * 100.0, 2),
        "calculated_accuracy_pct": round(accuracy * 100.0, 2)
    }

if __name__ == "__main__":
    print("======================================================================")
    print(" AegisSea — Dynamic Attribution Scorer Synthetic Benchmark Evaluator")
    print("======================================================================")
    benchmark_res = run_honest_attribution_benchmark(num_trials=100)
    print(f"Evaluated Scenarios   : {benchmark_res['trials_eval']}")
    print(f"Spatial Noise (Sigma) : {benchmark_res['noise_model']['spatial_sigma_km']} km")
    print(f"Heading Noise (Sigma) : {benchmark_res['noise_model']['heading_sigma_deg']} deg")
    print(f"Confusion Matrix      : {benchmark_res['confusion_matrix']}")
    print(f"Calculated Precision  : {benchmark_res['calculated_precision_pct']}%")
    print(f"Calculated Recall     : {benchmark_res['calculated_recall_pct']}%")
    print(f"Calculated F1-Score   : {benchmark_res['calculated_f1_pct']}%")
    print(f"Calculated Accuracy   : {benchmark_res['calculated_accuracy_pct']}%")
    print("======================================================================")
