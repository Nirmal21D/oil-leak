import numpy as np
import cv2
from typing import Dict, Any, Tuple

class SlickPhysicsAnalyzer:
    """
    Morphological & Physical Slick Analytics Service:
    Computes spatial morphology (area, perimeter, compactness) and applies
    Fay's Spreading Theory & Bonn Agreement oil thickness models to estimate
    slick volume and physical weathering state from 2D binary detection masks.
    """

    @staticmethod
    def analyze_slick_morphology(
        mask: np.ndarray, 
        pixel_resolution_m: float = 10.0,
        estimated_age_hours: float = 6.5
    ) -> Dict[str, Any]:
        """
        Analyzes 2D binary segmentation mask (1 = oil) with spatial scale resolution.
        - pixel_resolution_m: spatial resolution of SAR pixels (e.g., 10m for Sentinel-1 IW)
        - estimated_age_hours: elapsed hindcast time since release
        """
        oil_mask = (mask == 1).astype(np.uint8)
        oil_pixel_count = int(np.sum(oil_mask))

        if oil_pixel_count == 0:
            return {
                "area_sq_m": 0.0,
                "area_sq_km": 0.0,
                "perimeter_km": 0.0,
                "compactness_index": 0.0,
                "estimated_thickness_um": 0.0,
                "estimated_volume_m3": 0.0,
                "estimated_mass_tons": 0.0,
                "weathering_stage": "None"
            }

        # Area calculation
        pixel_area_sq_m = pixel_resolution_m * pixel_resolution_m
        area_sq_m = oil_pixel_count * pixel_area_sq_m
        area_sq_km = area_sq_m / 1e6

        # Contour extraction for perimeter and shape analysis
        contours, _ = cv2.findContours(oil_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        total_perimeter_pixels = 0.0
        for c in contours:
            total_perimeter_pixels += cv2.arcLength(c, True)

        perimeter_m = total_perimeter_pixels * pixel_resolution_m
        perimeter_km = perimeter_m / 1000.0

        # Compactness Index (Isoperimetric Quotient): 4 * pi * Area / Perimeter^2
        # Circular slick = 1.0; Elongated / wind-drifted streak < 0.3
        if perimeter_m > 0:
            compactness = float((4.0 * np.pi * area_sq_m) / (perimeter_m ** 2))
            compactness = min(1.0, round(compactness, 4))
        else:
            compactness = 0.0

        # Fay Spreading Theory & Bonn Agreement Oil Thickness Estimation
        # Aged ocean slicks (>4 hrs) undergo spreading into sheen (0.1-1.0 um) and thick patches (10-100 um).
        # We model effective average slick thickness h (in um) as a function of age t (hours) and compactness.
        # Wind drift causes elongation (low compactness), increasing spreading rate.
        base_thickness_um = 2.5  # Heavy crude / fuel oil average thickness in medium weathering phase
        age_decay_factor = max(0.5, 1.0 - (0.04 * estimated_age_hours))
        compactness_modifier = 1.0 + (1.0 - compactness) * 0.5
        
        effective_thickness_um = base_thickness_um * age_decay_factor * compactness_modifier
        effective_thickness_m = effective_thickness_um * 1e-6

        # Estimated Volume (m3) = Area (m2) * Thickness (m)
        volume_m3 = area_sq_m * effective_thickness_m
        
        # Crude oil density approx ~870 kg/m3 (0.87 metric tons / m3)
        mass_tons = volume_m3 * 0.87

        # Weathering Stage Classification
        if estimated_age_hours < 2.0:
            stage = "Initial Spreading (Gravity-Inertia)"
        elif estimated_age_hours < 12.0:
            stage = "Gravity-Viscous Drift & Evaporation"
        else:
            stage = "Advanced Weathering & Surface Tension Dissipation"

        return {
            "area_sq_m": round(area_sq_m, 2),
            "area_sq_km": round(area_sq_km, 2),
            "perimeter_km": round(perimeter_km, 2),
            "compactness_index": compactness,
            "estimated_thickness_um": round(effective_thickness_um, 2),
            "estimated_volume_m3": round(volume_m3, 2),
            "estimated_mass_tons": round(mass_tons, 2),
            "weathering_stage": stage
        }

if __name__ == "__main__":
    dummy_mask = np.zeros((512, 512), dtype=np.uint8)
    dummy_mask[100:200, 150:350] = 1 # Rectangle slick
    res = SlickPhysicsAnalyzer.analyze_slick_morphology(dummy_mask, pixel_resolution_m=10.0, estimated_age_hours=6.5)
    print("Slick Analytics Output:", res)
