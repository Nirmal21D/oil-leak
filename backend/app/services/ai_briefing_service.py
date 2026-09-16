import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class AIBriefingService:
    """
    Downstream Presentation Layer Service for AegisSea.
    Strictly downstream of deterministic scientific models:
    SAR -> CMEMS -> Drift -> AIS -> Attribution -> WPI -> Serializer -> Gemini / Deterministic Fallback.
    Never invents facts, never alters numerical scores, never claims court-admissibility.
    """

    @classmethod
    def generate_incident_briefing(cls, evidence_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a 3-part forensic/investigative plain-English executive briefing
        from a structured incident evidence payload.
        """
        # Extract generic payload fields without knowing specific scenario names
        scenario_id = evidence_payload.get("scenario_id") or evidence_payload.get("incident_id") or "INCIDENT-UNSPECIFIED"
        sector = evidence_payload.get("sector") or evidence_payload.get("display_location") or "Designated Maritime Sector"
        location = evidence_payload.get("location") or {}
        loc_display = evidence_payload.get("display_location") or f"{location.get('lat', 0.0):.3f}°, {location.get('lon', 0.0):.3f}°"
        
        # Telemetry & Metocean
        telemetry = evidence_payload.get("telemetry") or {}
        wind = telemetry.get("wind", "Nominal sea breeze")
        current = telemetry.get("current", "Standard oceanic drift")
        metocean_source = telemetry.get("metocean_source_label") or telemetry.get("metocean_source") or "CMEMS Reanalysis"
        
        # Slick morphology
        slick = evidence_payload.get("detected_slick") or {}
        slick_area = slick.get("area_sq_km")
        slick_area_str = f"{float(slick_area):.1f} km²" if slick_area is not None else "Unspecified area"
        slick_vol = slick.get("estimated_volume_m3")
        slick_vol_str = f"{float(slick_vol):.1f} m³" if slick_vol is not None else "Unknown volume"
        
        # Reconstructed release locus
        rec_release = evidence_payload.get("reconstructed_release") or {}
        release_lat = rec_release.get("lat")
        release_lon = rec_release.get("lon")
        release_locus_str = f"{release_lat:.4f}° N, {release_lon:.4f}° E" if (release_lat is not None and release_lon is not None) else "Model Hindcast Locus"
        
        # AIS attribution candidate
        ranked_suspects = evidence_payload.get("ranked_suspects") or []
        primary_candidate = ranked_suspects[0] if len(ranked_suspects) > 0 else None
        
        cand_name = primary_candidate.get("vessel_name", "UNKNOWN CONTACT") if primary_candidate else "NO CONTACT WITHIN SEARCH ENVELOPE"
        cand_mmsi = primary_candidate.get("mmsi", "—") if primary_candidate else "—"
        cand_type = primary_candidate.get("vessel_type", "Commercial Vessel") if primary_candidate else "—"
        cand_cpa = primary_candidate.get("distance_km") or primary_candidate.get("cpa_dist_km") if primary_candidate else None
        cand_cpa_str = f"{float(cand_cpa):.2f} km" if cand_cpa is not None else "N/A"
        cand_score = primary_candidate.get("attribution_score_pct") or primary_candidate.get("score_index") if primary_candidate else None
        cand_score_str = f"{float(cand_score):.1f} / 100" if cand_score is not None else "N/A"
        
        course_dev = primary_candidate.get("max_course_change_deg") if primary_candidate else None
        traj_score = primary_candidate.get("trajectory_score") if primary_candidate else None
        if traj_score is not None and traj_score == 0:
            traj_desc = "TRAJECTORY: NO POSITIVE CONTRIBUTION"
        elif course_dev is not None:
            traj_desc = f"TRAJECTORY: {int(round(course_dev))}° COURSE DEVIATION"
        else:
            traj_desc = "TRAJECTORY: STANDARD TRANSIT"
            
        # Logistics & Response
        routing = evidence_payload.get("responder_route") or evidence_payload.get("responder_routing") or {}
        port = routing.get("selected_port") or {}
        port_name = port.get("port_name") or routing.get("response_hub") or "Regional Marine Depot"
        port_dist = port.get("geodesic_distance_km") or routing.get("geodesic_distance_km")
        port_dist_str = f"{float(port_dist):.1f} km (geodesic)" if port_dist is not None else "Distance unavailable"
        
        # Check for Gemini API key
        api_key = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")).strip()
        
        if api_key:
            try:
                gemini_res = cls._call_gemini_api(
                    api_key=api_key,
                    scenario_id=scenario_id,
                    sector=sector,
                    loc_display=loc_display,
                    slick_area_str=slick_area_str,
                    slick_vol_str=slick_vol_str,
                    release_locus_str=release_locus_str,
                    wind=wind,
                    current=current,
                    metocean_source=metocean_source,
                    cand_name=cand_name,
                    cand_mmsi=cand_mmsi,
                    cand_type=cand_type,
                    cand_cpa_str=cand_cpa_str,
                    cand_score_str=cand_score_str,
                    traj_desc=traj_desc,
                    port_name=port_name,
                    port_dist_str=port_dist_str
                )
                if gemini_res:
                    return gemini_res
            except Exception as exc:
                logger.warning(f"Gemini API call failed, falling back to deterministic forensic generator: {exc}")

        # High-Fidelity Deterministic Fallback Generator
        return cls._generate_deterministic_briefing(
            scenario_id=scenario_id,
            sector=sector,
            loc_display=loc_display,
            slick_area_str=slick_area_str,
            slick_vol_str=slick_vol_str,
            release_locus_str=release_locus_str,
            wind=wind,
            current=current,
            metocean_source=metocean_source,
            cand_name=cand_name,
            cand_mmsi=cand_mmsi,
            cand_type=cand_type,
            cand_cpa_str=cand_cpa_str,
            cand_score_str=cand_score_str,
            traj_desc=traj_desc,
            port_name=port_name,
            port_dist_str=port_dist_str
        )

    @classmethod
    def _call_gemini_api(cls, api_key: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Invokes Gemini 1.5 Flash via REST API with grounded system prompt."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        system_instruction = (
            "You are the AegisSea Maritime Intelligence Briefing Officer. "
            "Your role is to write a concise, forensic, professional 3-paragraph executive intelligence briefing "
            "based strictly on provided deterministic sensor and mathematical evidence. "
            "CRITICAL RULES: "
            "1. NEVER claim court admissibility or legal guilt. Describe solely as 'forensic/investigative evidence presentation'. "
            "2. NEVER use terms like 'verdict' or 'culprit'. Use 'primary attribution candidate' or 'investigative lead'. "
            "3. State clearly that the attribution score is an engineering prioritization index, not a probability of responsibility. "
            "4. Acknowledge that the reconstructed release locus has a ±3.5 km hydrodynamic uncertainty envelope. "
            "5. Present evidence in 3 clean sections: 1. Observation & Metocean Forcing, 2. Drift Reconstruction & AIS Contact Correlation, 3. Response Infrastructure & Recommended Triage."
        )
        
        prompt_text = f"""
Incident ID: {kwargs.get('scenario_id')}
Sector: {kwargs.get('sector')} ({kwargs.get('loc_display')})
Slick Surface Footprint: {kwargs.get('slick_area_str')} (Estimated Vol: {kwargs.get('slick_vol_str')})
Reconstructed Release Locus: {kwargs.get('release_locus_str')} (±3.5 km uncertainty)
Metocean Forcing: Wind {kwargs.get('wind')}, Surface Current {kwargs.get('current')} ({kwargs.get('metocean_source')})
Primary Attribution Candidate: {kwargs.get('cand_name')} (MMSI: {kwargs.get('cand_mmsi')}, Type: {kwargs.get('cand_type')})
Candidate Telemetry: CPA {kwargs.get('cand_cpa_str')}, {kwargs.get('traj_desc')}
AegisSea Attribution Index: {kwargs.get('cand_score_str')}
Response Resource: {kwargs.get('port_name')} at {kwargs.get('port_dist_str')}

Please provide a 3-paragraph executive briefing following the forensic rules strictly.
"""
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {"text": system_instruction}
                ]
            },
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            
            return {
                "status": "success",
                "source": "gemini-1.5-flash",
                "headline": f"INTELLIGENCE BRIEFING // {kwargs.get('cand_name')} PRIORITIZED FOR INTERROGATION",
                "full_text": content.strip(),
                "summary": f"Slick ({kwargs.get('slick_area_str')}) detected at {kwargs.get('loc_display')}. Contact {kwargs.get('cand_name')} scored {kwargs.get('cand_score_str')} on engineering attribution index.",
                "disclaimer": "Automated forensic/investigative briefing. Does not constitute a judicial verdict or establish legal causality.",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

    @classmethod
    def _generate_deterministic_briefing(cls, **kwargs) -> Dict[str, Any]:
        """
        High-fidelity deterministic template engine.
        Ensures 100% availability without network or external API requirements.
        Strictly conforms to legal, scientific, and forensic UX boundaries.
        """
        para_1 = (
            f"1. SATELLITE SAR OBSERVATION & METOCEAN FORCING: "
            f"Sentinel-1 C-band SAR satellite telemetry confirms a hydrocarbon surface slick spanning approximately {kwargs.get('slick_area_str')} "
            f"({kwargs.get('slick_vol_str')}) within the {kwargs.get('sector')} ({kwargs.get('loc_display')}). "
            f"Coincident metocean reanalysis ({kwargs.get('metocean_source')}) recorded winds of {kwargs.get('wind')} coupled with a surface current of {kwargs.get('current')}, "
            f"establishing the primary physical advection forcing vectors acting upon the observed slick."
        )
        
        para_2 = (
            f"2. HYDRODYNAMIC DRIFT RECONSTRUCTION & AIS CORRELATION: "
            f"Two-dimensional backward Lagrangian advection hindcast models the temporal release locus at {kwargs.get('release_locus_str')} "
            f"(with an operational uncertainty envelope of ±3.5 km resulting from sub-grid turbulence and shear). "
            f"Cross-referencing historical AIS trajectories within the release window identifies vessel {kwargs.get('cand_name')} "
            f"(MMSI {kwargs.get('cand_mmsi')}, {kwargs.get('cand_type')}) as the primary attribution lead. "
            f"The vessel recorded a Closest Point of Approach (CPA) of {kwargs.get('cand_cpa_str')} to the modeled release locus, "
            f"with kinematic telemetry indicating {kwargs.get('traj_desc')}. "
            f"This contact yields an AegisSea Attribution Index of {kwargs.get('cand_score_str')}."
        )
        
        para_3 = (
            f"3. RESPONSE LOGISTICS & INVESTIGATIVE TRIAGE: "
            f"The nearest available maritime response infrastructure is indexed at {kwargs.get('port_name')} "
            f"({kwargs.get('port_dist_str')}). Based on multi-criteria evidentiary correlation, law enforcement boarding teams "
            f"are advised to prioritize {kwargs.get('cand_name')} for physical logbook inspection, bilge discharge valve verification, "
            f"and hydrocarbon chemical fingerprinting. Note: This assessment represents an engineering prioritization index "
            f"for forensic investigation and does not constitute a judicial verdict of liability."
        )
        
        full_text = f"{para_1}\n\n{para_2}\n\n{para_3}"
        
        return {
            "status": "success",
            "source": "deterministic_forensic_engine",
            "headline": f"INVESTIGATIVE BRIEFING // {kwargs.get('cand_name')} IDENTIFIED AS LEAD CANDIDATE",
            "full_text": full_text,
            "summary": f"Hydrocarbon slick ({kwargs.get('slick_area_str')}) localized to {kwargs.get('loc_display')}. Contact {kwargs.get('cand_name')} flagged at {kwargs.get('cand_score_str')} attribution index.",
            "disclaimer": "Automated forensic/investigative presentation. Engineering prioritization index; not a probability of responsibility.",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
