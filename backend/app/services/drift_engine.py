import math
import numpy as np
from typing import List, Dict, Any, Tuple

class HindcastDriftEngine:
    """
    Custom Lagrangian Reverse Particle Advection Solver (Inspired by OpenDrift / OpenOil):
    Simulates reverse particle trajectory over time [t0 - dt * steps -> t0]
    using time-varying surface current vectors & wind drift coefficients.
    
    Data Source Framing:
    - Base current & wind vectors are representative order-of-magnitude estimates 
      consistent with general Arabian Sea surface current literature (~0.35 m/s near Mumbai High), 
      not tied to a specific INCOIS dataset or live Copernicus Marine NetCDF feeds.
    - Includes semi-diurnal M2 tidal current oscillation (12.42-hour period) to model
      realistic physical curvature along the Konkan coast trajectory.
    """
    def __init__(self, wind_drift_factor: float = 0.03):
        self.wind_drift_factor = wind_drift_factor

    def run_backward_hindcast(
        self,
        origin_lat: float,
        origin_lon: float,
        hours_back: float = 6.5,
        time_step_mins: float = 15.0,
        u_current_base: float = 0.35,   # Base Eastward current (m/s)
        v_current_base: float = -0.20,  # Base Northward current (m/s)
        u_wind_base: float = 2.5,       # Base Eastward wind (m/s)
        v_wind_base: float = -3.0       # Base Northward wind (m/s)
    ) -> Dict[str, Any]:
        """
        Calculates reverse particle trajectory with semi-diurnal tidal current variation.
        """
        total_seconds = hours_back * 3600
        step_seconds = time_step_mins * 60
        num_steps = int(total_seconds / step_seconds)

        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * math.cos(math.radians(origin_lat)))

        trajectory = []
        cur_lat = origin_lat
        cur_lon = origin_lon

        for i in range(num_steps + 1):
            elapsed_hrs = round((i * step_seconds) / 3600.0, 2)
            
            # Semi-diurnal M2 tidal current oscillation (12.42 hr period) for realistic curvature
            t_phase = (elapsed_hrs / 12.42) * 2.0 * math.pi
            u_tidal = 0.15 * math.sin(t_phase)
            v_tidal = 0.10 * math.cos(t_phase)

            # Combined time-varying drift velocity
            u_total = (u_current_base + u_tidal) + (self.wind_drift_factor * u_wind_base)
            v_total = (v_current_base + v_tidal) + (self.wind_drift_factor * v_wind_base)

            trajectory.append({
                "step": i,
                "hours_ago": elapsed_hrs,
                "lat": round(cur_lat, 5),
                "lon": round(cur_lon, 5),
                "u_m_s": round(u_total, 3),
                "v_m_s": round(v_total, 3)
            })

            # Reverse step displacement
            cur_lat -= (v_total * step_seconds) * lat_per_m
            cur_lon -= (u_total * step_seconds) * lon_per_m

        estimated_origin = trajectory[-1]

        u_avg = u_current_base + (self.wind_drift_factor * u_wind_base)
        v_avg = v_current_base + (self.wind_drift_factor * v_wind_base)
        heading_deg = (math.degrees(math.atan2(u_avg, v_avg)) + 360) % 360
        speed_knots = math.hypot(u_avg, v_avg) * 1.94384

        drift_cone = self.calculate_drift_cone_polygon(origin_lat, origin_lon, estimated_origin["lat"], estimated_origin["lon"], heading_deg)

        return {
            "engine_type": "Custom Lagrangian Solver (OpenDrift OpenOil Architecture)",
            "origin_detected": {"lat": origin_lat, "lon": origin_lon},
            "reconstructed_release": estimated_origin,
            "drift_heading_deg": round(heading_deg, 1),
            "drift_speed_knots": round(speed_knots, 2),
            "hours_hindcasted": hours_back,
            "trajectory_points": trajectory,
            "drift_cone_polygon": drift_cone
        }

    def run_forward_forecast(
        self,
        origin_lat: float,
        origin_lon: float,
        hours_ahead: float = 12.0,
        time_step_mins: float = 15.0,
        u_current_base: float = 0.35,   # Base Eastward current (m/s)
        v_current_base: float = -0.20,  # Base Northward current (m/s)
        u_wind_base: float = 2.5,       # Base Eastward wind (m/s)
        v_wind_base: float = -3.0       # Base Northward wind (m/s)
    ) -> Dict[str, Any]:
        """
        Calculates forward drift particle trajectory over time [t0 -> t0 + hours_ahead]
        using time-varying surface current vectors & wind drift coefficients.
        Predicts future slick flow and coastal landfall horizon.
        """
        total_seconds = hours_ahead * 3600
        step_seconds = time_step_mins * 60
        num_steps = int(total_seconds / step_seconds)

        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * math.cos(math.radians(origin_lat)))

        trajectory = []
        cur_lat = origin_lat
        cur_lon = origin_lon

        for i in range(num_steps + 1):
            elapsed_hrs = round((i * step_seconds) / 3600.0, 2)
            
            # Semi-diurnal M2 tidal current oscillation (12.42 hr period)
            t_phase = (elapsed_hrs / 12.42) * 2.0 * math.pi
            u_tidal = 0.15 * math.sin(t_phase)
            v_tidal = 0.10 * math.cos(t_phase)

            # Combined forward drift velocity
            u_total = (u_current_base + u_tidal) + (self.wind_drift_factor * u_wind_base)
            v_total = (v_current_base + v_tidal) + (self.wind_drift_factor * v_wind_base)

            trajectory.append({
                "step": i,
                "hours_ahead": elapsed_hrs,
                "lat": round(cur_lat, 5),
                "lon": round(cur_lon, 5),
                "u_m_s": round(u_total, 3),
                "v_m_s": round(v_total, 3)
            })

            # Forward step displacement
            cur_lat += (v_total * step_seconds) * lat_per_m
            cur_lon += (u_total * step_seconds) * lon_per_m

        predicted_landfall = trajectory[-1]

        u_avg = u_current_base + (self.wind_drift_factor * u_wind_base)
        v_avg = v_current_base + (self.wind_drift_factor * v_wind_base)
        heading_deg = (math.degrees(math.atan2(u_avg, v_avg)) + 360) % 360
        speed_knots = math.hypot(u_avg, v_avg) * 1.94384

        drift_cone = self.calculate_drift_cone_polygon(origin_lat, origin_lon, predicted_landfall["lat"], predicted_landfall["lon"], heading_deg)

        return {
            "engine_type": "Custom Forward Forecast Lagrangian Solver",
            "detection_center": {"lat": origin_lat, "lon": origin_lon},
            "predicted_landfall_position": predicted_landfall,
            "drift_heading_deg": round(heading_deg, 1),
            "drift_speed_knots": round(speed_knots, 2),
            "hours_forecasted": hours_ahead,
            "forecast_trajectory_points": trajectory,
            "forecast_drift_cone_polygon": drift_cone
        }

    def calculate_drift_cone_polygon(
        self, 
        origin_lat: float, 
        origin_lon: float, 
        release_lat: float, 
        release_lon: float, 
        heading_deg: float,
        expansion_angle_deg: float = 35.0
    ) -> List[List[float]]:
        """
        Generates 2D Drift Expansion Cone Polygon coordinates [release_point -> cone_left -> origin -> cone_right -> release_point].
        Matches the translucent yellow/red drift cone in the reference MARITRACE C2 Tactical Console interface.
        """
        rad_left = math.radians(heading_deg - (expansion_angle_deg / 2.0))
        rad_right = math.radians(heading_deg + (expansion_angle_deg / 2.0))

        dist_m = 12000.0 # Cone width spread at origin boundary
        lat_per_m = 1.0 / 111000.0
        lon_per_m = 1.0 / (111000.0 * math.cos(math.radians(origin_lat)))

        left_lat = round(origin_lat + (math.cos(rad_left) * dist_m * lat_per_m), 5)
        left_lon = round(origin_lon + (math.sin(rad_left) * dist_m * lon_per_m), 5)

        right_lat = round(origin_lat + (math.cos(rad_right) * dist_m * lat_per_m), 5)
        right_lon = round(origin_lon + (math.sin(rad_right) * dist_m * lon_per_m), 5)

        # Polygon coordinates: [Release Origin -> Left Boundary -> Detected Slick -> Right Boundary]
        return [
            [release_lat, release_lon],
            [left_lat, left_lon],
            [origin_lat, origin_lon],
            [right_lat, right_lon]
        ]

class VesselAttributionScorer:
    """
    Multi-Signal AIS Correlation & Vessel Attribution Scorer (3-Term PS 26143 Formula):
    Calculates combined Proximity + Trajectory + Behavioral Anomaly score.
    
    Formula Weights (PS 26143 Exact Specification):
    - S_overall = 0.45 * S_proximity + 0.30 * S_trajectory + 0.25 * S_anomaly
    
    Dimensions Weighed:
    1. Spatial Proximity (S_prox): Distance between vessel track point and reconstructed release origin.
    2. Track Trajectory (S_traj): Vector alignment between vessel heading and slick drift direction.
    3. Behavioral Anomaly (S_anomaly): Evaluates transponder blackout/AIS gaps, open-water speed drops (discharge maneuvers), and draft changes.
    """
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def score_vessel(
        self,
        vessel_lat: float,
        vessel_lon: float,
        vessel_heading_deg: float,
        reconstructed_origin: Dict[str, float],
        drift_heading_deg: float,
        sigma_km: float = 5.0,
        vessel_speed_knots: float = 12.4,
        ais_gap_flag: bool = False,
        speed_drop_flag: bool = False,
        draft_change_m: float = 0.0
    ) -> Dict[str, float]:
        dist_km = self.haversine_distance_km(
            vessel_lat, vessel_lon,
            reconstructed_origin["lat"], reconstructed_origin["lon"]
        )

        # 1. Proximity Score (Gaussian Decay)
        prox_score = math.exp(-(dist_km ** 2) / (2.0 * (sigma_km ** 2)))

        # 2. Trajectory Alignment Score (Cosine Directional Difference)
        rad_diff = math.radians(vessel_heading_deg - drift_heading_deg)
        traj_score = max(0.0, math.cos(rad_diff))

        # 3. Behavioral Anomaly Score (Weighs AIS Gaps, Discharge Speed Drop & Draft Delta)
        anomaly_components = []
        if ais_gap_flag:
            anomaly_components.append(0.90)  # Transponder blackout near release window
        if speed_drop_flag or vessel_speed_knots < 5.0:
            anomaly_components.append(0.75)  # Slow speed in open sea (potential discharge maneuver)
        if draft_change_m > 0.5:
            anomaly_components.append(0.85)  # Significant cargo/ballast discharge

        if anomaly_components:
            anomaly_score = float(np.mean(anomaly_components))
        else:
            anomaly_score = 0.15  # Normal baseline commercial transit anomaly

        # 3-Term Weighted Formula (PS 26143 Explicit Requirements)
        total_score = (0.45 * prox_score) + (0.30 * traj_score) + (0.25 * anomaly_score)

        return {
            "proximity_km": round(dist_km, 2),
            "proximity_score": round(prox_score, 3),
            "trajectory_score": round(traj_score, 3),
            "behavioral_anomaly_score": round(anomaly_score, 3),
            "overall_score": round(total_score, 3)
        }

if __name__ == "__main__":
    engine = HindcastDriftEngine()
    result = engine.run_backward_hindcast(19.412, 71.325, hours_back=6.5)
    forecast = engine.run_forward_forecast(19.412, 71.325, hours_ahead=12.0)
    print(f"Engine Type : {result['engine_type']}")
    print(f"Reconstructed Release Point : {result['reconstructed_release']}")
    print(f"Forward Landfall Position   : {forecast['predicted_landfall_position']}")

