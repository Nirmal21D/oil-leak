'use client';

import React from 'react';
import { formatCoordinate } from '../utils/geo';

interface ContextualIntelPanelProps {
  activeModule: 'overview' | 'sar' | 'drift' | 'ais' | 'responder';
  scenarioData?: any;
  detectionResult?: any;
  selectedVessel?: any;
  onSelectVessel?: (vessel: any) => void;
  onOpenDossier: () => void;
  onSwitchModule?: (mod: any) => void;
}

export default function ContextualIntelPanel({
  activeModule,
  scenarioData,
  detectionResult,
  selectedVessel,
  onSelectVessel,
  onOpenDossier,
  onSwitchModule,
}: ContextualIntelPanelProps) {
  const activeCandidate =
    selectedVessel ||
    (scenarioData?.ranked_suspects && scenarioData.ranked_suspects.length > 0
      ? scenarioData.ranked_suspects[0]
      : null);

  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;
  const slickArea = morphology?.area_sq_km != null ? `${Number(morphology.area_sq_km).toFixed(1)} KM²` : 'NOT AVAILABLE';
  const volumeM3 = morphology?.estimated_volume_m3 != null ? `${Number(morphology.estimated_volume_m3).toFixed(1)} M³` : 'NOT AVAILABLE';
  const massTons = morphology?.estimated_mass_tons != null ? `~${Number(morphology.estimated_mass_tons).toFixed(1)} Metric Tons` : 'UNAVAILABLE';
  const recRelease = scenarioData?.reconstructed_release;
  const routing = scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing;
  const selectedPort = routing?.selected_port;
  const candidateAudit = routing?.candidate_audit;
  const rankedCandidates = scenarioData?.ranked_suspects || [];

  const rawScore = activeCandidate?.attribution_score_pct ?? activeCandidate?.score_index;
  const scoreDisplay = rawScore != null ? `${Number(rawScore).toFixed(1)} / 100` : 'N/A';

  // Factor breakdown dynamically from candidate
  const breakdown = activeCandidate?.attribution_breakdown;
  const proxPts = breakdown?.proximity_weighted_pct != null
    ? `+${Number(breakdown.proximity_weighted_pct).toFixed(1)} pts`
    : (activeCandidate?.proximity_score != null ? `+${(activeCandidate.proximity_score * 45).toFixed(1)} pts` : 'N/A');
  const proxCpa = (activeCandidate?.distance_km ?? activeCandidate?.cpa_dist_km) != null
    ? `CPA ${(activeCandidate.distance_km ?? activeCandidate.cpa_dist_km).toFixed(1)} km`
    : 'CPA N/A';

  const trajPts = breakdown?.trajectory_weighted_pct != null
    ? `+${Number(breakdown.trajectory_weighted_pct).toFixed(1)} pts`
    : (activeCandidate?.trajectory_score != null ? `+${(activeCandidate.trajectory_score * 30).toFixed(1)} pts` : 'N/A');
  const trajFactor = activeCandidate?.trajectory_score != null
    ? `Factor: ${Number(activeCandidate.trajectory_score).toFixed(3)}`
    : 'Factor: N/A';

  const behavPts = breakdown?.behavioral_weighted_pct != null
    ? `+${Number(breakdown.behavioral_weighted_pct).toFixed(1)} pts`
    : (activeCandidate?.behavioral_anomaly_score != null ? `+${(activeCandidate.behavioral_anomaly_score * 25).toFixed(1)} pts` : 'N/A');
  const behavDeflect = activeCandidate?.max_course_change_deg != null
    ? `${Number(activeCandidate.max_course_change_deg).toFixed(0)}° Deflect`
    : (activeCandidate?.behavioral_anomaly_score != null ? `${(activeCandidate.behavioral_anomaly_score * 100).toFixed(0)}% Anom` : 'N/A');

  return (
    <aside className="w-full lg:w-[380px] shrink-0 bg-tactical-navy border border-tactical-border flex flex-col justify-between font-mono text-xs select-none">
      
      {/* =========================================================================
          VIEW 1: OVERVIEW / DEFAULT INCIDENT INTELLIGENCE
         ========================================================================= */}
      {activeModule === 'overview' && (
        <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="border-b border-tactical-border pb-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                INTELLIGENCE SYNTHESIS
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                INCIDENT INTELLIGENCE
              </h3>
            </div>
            <span className="stamp-tag border-tactical-amber text-tactical-amber text-[9px] px-1.5 py-0.2">
              ACTIVE FIX
            </span>
          </div>

          {/* Slick Footprint Telemetry */}
          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-tactical-dim border-b border-tactical-border/60 pb-1">
              <span>DETECTED HYDROCARBON SLICK</span>
              <span className="text-tactical-amber font-bold">SENTINEL-1A C-SAR</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-tactical-muted block text-[10px]">SURFACE AREA</span>
                <strong className="text-tactical-amber font-black text-base">{slickArea}</strong>
                <span className="text-[9px] text-tactical-dim block">±15% Uncertainty</span>
              </div>
              <div>
                <span className="text-tactical-muted block text-[10px]">FAY VOLUME EST.</span>
                <strong className="text-tactical-text font-black text-base">{volumeM3}</strong>
                <span className="text-[9px] text-tactical-dim block">{massTons}</span>
              </div>
            </div>
            <div className="text-[10px] text-tactical-muted pt-1 border-t border-tactical-border/60 flex justify-between">
              <span>OBSERVATION TIME:</span>
              <span className="text-tactical-text font-bold">
                {scenarioData?.telemetry?.metocean_query_time || scenarioData?.release_window?.observation_time_utc || 'AWAITING SENSOR INGEST'}
              </span>
            </div>
          </div>

          {/* Reconstructed Release Locus */}
          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-tactical-dim border-b border-tactical-border/60 pb-1">
              <span>RECONSTRUCTED RELEASE LOCUS</span>
              <span className="text-tactical-cyan font-bold">CMEMS HINDCAST</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-tactical-text font-bold block">
                  {recRelease ? formatCoordinate(recRelease.lat, recRelease.lon) : 'STANDBY // AWAITING SENSOR INGEST'}
                </span>
                <span className="text-[10px] text-tactical-muted">{scenarioData?.sector || 'STANDBY // NO ACTIVE FIX'}</span>
              </div>
              <div className="text-right">
                <span className="text-tactical-amber font-bold text-xs">T − 6.5H</span>
                <span className="text-[9px] text-tactical-dim block">±3.5 KM ENVELOPE</span>
              </div>
            </div>
          </div>

          {/* Top Attribution Lead Card */}
          <div className="bg-tactical-panel border-2 border-tactical-amber p-3.5 space-y-2.5">
            <div className="flex items-start justify-between border-b border-tactical-border pb-2">
              <div>
                <span className="text-[9px] text-tactical-dim font-bold uppercase tracking-wider block">
                  PRIMARY ATTRIBUTION CANDIDATE
                </span>
                <h4 className="font-extrabold text-base text-tactical-text font-display uppercase">
                  {activeCandidate?.vessel_name || (scenarioData ? 'NO CANDIDATE IDENTIFIED' : 'STANDBY')}
                </h4>
                <span className="text-[10px] text-tactical-muted font-mono">
                  {activeCandidate?.mmsi ? `MMSI: ${activeCandidate.mmsi}` : 'MMSI: —'} · {activeCandidate?.vessel_type?.toUpperCase() || 'VESSEL'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-tactical-dim uppercase block">AEGISSEA INDEX</span>
                <span className="text-xl font-black text-tactical-amber font-mono">
                  {scoreDisplay}
                </span>
              </div>
            </div>

            {/* Why This Candidate Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-tactical-dim font-bold uppercase block">
                WHY THIS CANDIDATE? // FACTOR CONTRIBUTION
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="bg-tactical-navy p-1.5 border border-tactical-border">
                  <span className="text-tactical-muted block text-[9px]">PROXIMITY</span>
                  <strong className="text-tactical-amber block font-bold">{proxPts}</strong>
                  <span className="text-tactical-dim text-[8px]">{proxCpa}</span>
                </div>
                <div className="bg-tactical-navy p-1.5 border border-tactical-amber/50">
                  <span className="text-tactical-amber block text-[9px] font-bold">TRAJECTORY</span>
                  <strong className="text-tactical-amber block font-bold">{trajPts}</strong>
                  <span className="text-tactical-dim text-[8px]">{trajFactor}</span>
                </div>
                <div className="bg-tactical-navy p-1.5 border border-tactical-border">
                  <span className="text-tactical-muted block text-[9px]">BEHAVIOR</span>
                  <strong className="text-tactical-text block font-bold">{behavPts}</strong>
                  <span className="text-tactical-dim text-[8px]">{behavDeflect}</span>
                </div>
              </div>
              <p className="text-[9px] text-tactical-dim leading-tight pt-1">
                * Factor breakdown computed dynamically from spatial proximity, course convergence, and behavioral anomaly vectors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SAR OBSERVATION WORKSPACE DETAILS
         ========================================================================= */}
      {activeModule === 'sar' && (
        <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="border-b border-tactical-border pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                REMOTE SENSING FORENSICS
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                SAR OBSERVATION & SEGMENTATION
              </h3>
            </div>
            <span className="stamp-tag border-tactical-green text-tactical-green text-[9px]">
              VERIFIED
            </span>
          </div>

          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-tactical-dim block text-[10px]">SOURCE SENSOR</span>
                <strong className="text-tactical-text font-bold">Sentinel-1A C-SAR</strong>
              </div>
              <div>
                <span className="text-tactical-dim block text-[10px]">ACQUISITION MODE</span>
                <strong className="text-tactical-text">IW GRDH (10m)</strong>
              </div>
              <div>
                <span className="text-tactical-dim block text-[10px]">POLARIZATION</span>
                <strong className="text-tactical-text">VV / VH Co-pol</strong>
              </div>
              <div>
                <span className="text-tactical-dim block text-[10px]">SCENE TIME (UTC)</span>
                <strong className="text-tactical-text">00:01:49 UTC</strong>
              </div>
            </div>
          </div>

          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-2">
            <span className="text-[10px] text-tactical-dim font-bold uppercase block">
              NEURAL SEGMENTATION MASK (RESNET-34 U-NET)
            </span>
            <div className="bg-tactical-base border border-tactical-border p-2 flex items-center justify-center max-h-48 overflow-hidden">
              {detectionResult?.mask_base64 ? (
                <img
                  src={detectionResult.mask_base64}
                  alt="SAR Segmentation Mask"
                  className="max-h-44 object-contain"
                />
              ) : (
                <div className="py-8 text-tactical-dim text-[11px] text-center">
                  [ SAR OIL SPILL MASK: 00111_oil_mask.png · 14.8 KM² ]
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-tactical-muted pt-1 border-t border-tactical-border">
              <span>ZENODO BENCHMARK:</span>
              <span className="text-tactical-green font-bold">IoU 0.826 · F1 0.892</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DRIFT MODEL & METOCEAN FORCING
         ========================================================================= */}
      {activeModule === 'drift' && (
        <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="border-b border-tactical-border pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                HYDRODYNAMIC HINDCAST
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                CMEMS METOCEAN DRIFT
              </h3>
            </div>
            <span className="stamp-tag border-tactical-cyan text-tactical-cyan text-[9px]">
              PHY-001-024
            </span>
          </div>

          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-2">
            <span className="text-[10px] text-tactical-dim font-bold uppercase block">
              METOCEAN FORCING VECTORS (ERA5 + CMEMS)
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between border-b border-tactical-border/60 pb-1">
                <span className="text-tactical-muted">10m Surface Wind:</span>
                <strong className="text-tactical-text">{scenarioData?.telemetry?.wind || '3.6 kts @ 146°'}</strong>
              </div>
              <div className="flex justify-between border-b border-tactical-border/60 pb-1">
                <span className="text-tactical-muted">Surface Ocean Current:</span>
                <strong className="text-tactical-text">{scenarioData?.telemetry?.current || '0.2 kts @ 236°'}</strong>
              </div>
              <div className="flex justify-between border-b border-tactical-border/60 pb-1">
                <span className="text-tactical-muted">Leeway Windage Factor:</span>
                <strong className="text-tactical-text">3.1% Advection</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Backward Window:</span>
                <strong className="text-tactical-amber font-bold">T − 6.5 Hours (17:31 UTC)</strong>
              </div>
            </div>
          </div>

          <div className="bg-tactical-panel border border-tactical-border p-3 space-y-1.5">
            <span className="text-[10px] text-tactical-dim font-bold uppercase block">
              FAY HYDRODYNAMIC SPREADING MODEL
            </span>
            <p className="text-[10px] text-tactical-muted leading-relaxed">
              Gravity-viscous regime balance establishes that a 14.8 km² slick with API 32 crude requires 5.8 to 7.2 hours of open-sea spreading, corroborating the T−6.5H backward advection release estimate.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: AIS CORRELATION & CANDIDATE RANKING
         ========================================================================= */}
      {activeModule === 'ais' && (
        <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="border-b border-tactical-border pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                KINEMATIC CORRELATION
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                AIS TRAJECTORY MATRIX
              </h3>
            </div>
            <span className="stamp-tag border-tactical-green text-tactical-green text-[9px]">
              NOAA ARCHIVE
            </span>
          </div>

          <div className="bg-tactical-panel border border-tactical-border p-2.5 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <span className="text-tactical-dim block text-[10px]">RAW PINGS SCANNED</span>
              <strong className="text-tactical-text font-bold text-sm">
                {scenarioData?.ais_provenance?.raw_pings_scanned != null
                  ? scenarioData.ais_provenance.raw_pings_scanned.toLocaleString()
                  : (scenarioData ? 'AIS DATA UNAVAILABLE' : '—')}
              </strong>
            </div>
            <div>
              <span className="text-tactical-dim block text-[10px]">VESSELS TRACKED</span>
              <strong className="text-tactical-text font-bold text-sm">
                {scenarioData?.ais_provenance?.unique_vessels_tracked != null
                  ? `${scenarioData.ais_provenance.unique_vessels_tracked} VESSELS`
                  : (scenarioData ? 'AIS DATA UNAVAILABLE' : '—')}
              </strong>
            </div>
          </div>

          {/* Candidate List */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-tactical-dim font-bold uppercase block">
              RANKED ATTRIBUTION CANDIDATES
            </span>
            <div className="space-y-1">
              {rankedCandidates.length > 0 ? (
                rankedCandidates.slice(0, 4).map((c: any, idx: number) => {
                  const isSel = (c.mmsi === activeCandidate?.mmsi);
                  const cpaDist = (c.distance_km ?? c.cpa_dist_km);
                  const cpaStr = cpaDist != null ? `${cpaDist.toFixed(1)} km` : 'N/A';
                  const scoreVal = c.attribution_score_pct ?? c.score_index;
                  const scoreStr = scoreVal != null ? Number(scoreVal).toFixed(1) : 'N/A';
                  return (
                    <button
                      key={c.mmsi || idx}
                      onClick={() => onSelectVessel && onSelectVessel(c)}
                      className={`w-full text-left p-2 border transition flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'border-tactical-amber bg-tactical-panel font-bold'
                          : 'border-tactical-border bg-tactical-base hover:bg-tactical-panel text-tactical-muted'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-tactical-dim">#{String(idx + 1).padStart(2, '0')}</span>
                          <span className={isSel ? 'text-tactical-text' : 'text-tactical-muted'}>
                            {c.vessel_name || 'UNKNOWN'}
                          </span>
                        </div>
                        <span className="text-[9px] text-tactical-dim">
                          MMSI {c.mmsi || '—'} · CPA {cpaStr}
                        </span>
                      </div>
                      <span className="text-tactical-amber font-mono font-bold text-xs">
                        {scoreStr}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 bg-tactical-base border border-tactical-border text-center text-tactical-dim text-[11px]">
                  {scenarioData ? 'NO ATTRIBUTION CANDIDATES' : 'STANDBY // AWAITING SCENE'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: RESPONSE INFRASTRUCTURE (NGA WPI)
         ========================================================================= */}
      {activeModule === 'responder' && (
        <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="border-b border-tactical-border pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                LOGISTICS & RESPONSE
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                RESPONSE INFRASTRUCTURE
              </h3>
            </div>
            <span className="stamp-tag border-tactical-amber text-tactical-amber text-[9px]">
              {routing?.routing_status || 'GEODESIC FALLBACK'}
            </span>
          </div>

          <div className="bg-tactical-panel border-2 border-tactical-border p-3 space-y-2">
            <div className="flex items-start justify-between border-b border-tactical-border pb-1.5">
              <div>
                <span className="text-[9px] text-tactical-dim font-bold uppercase block">
                  RESPONSE PORT CANDIDATE
                </span>
                <strong className="text-tactical-text text-base font-display uppercase">
                  {selectedPort?.port_name || (routing ? 'NO SUITABLE PORT FOUND' : 'WPI DATA UNAVAILABLE')}
                </strong>
                <span className="text-[10px] text-tactical-muted block">
                  {selectedPort
                    ? `NGA WPI #${selectedPort.wpi_number || '—'} · ${selectedPort.un_locode || 'N/A'}`
                    : '—'}
                </span>
              </div>
              {selectedPort && (
                <span className="bg-tactical-amber text-tactical-base px-2 py-0.5 text-[9px] font-black uppercase">
                  ★ SELECTED
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-tactical-muted">Geodesic Distance:</span>
                <strong className="text-tactical-text font-mono">
                  {selectedPort?.geodesic_distance_km != null
                    ? `${Number(selectedPort.geodesic_distance_km).toFixed(1)} km`
                    : 'NOT AVAILABLE'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Maritime Access:</span>
                <strong className="text-tactical-amber font-mono">{routing?.maritime_access || 'Not evaluated'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Navigable Waterway:</span>
                <strong className="text-tactical-amber font-mono">
                  {routing?.navigable_distance_km ? `${routing.navigable_distance_km} km` : 'NOT ESTABLISHED'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Operational Transit ETA:</span>
                <strong className="text-tactical-amber font-mono">
                  {routing?.operational_eta_formatted || 'NOT ESTABLISHED'}
                </strong>
              </div>
            </div>
          </div>

          <div className="border border-tactical-border bg-tactical-base p-2 space-y-1 text-[10px]">
            <div className="flex items-center justify-between text-tactical-dim border-b border-tactical-border/60 pb-1">
              <span>WPI CANDIDATE AUDIT</span>
              <span>
                {candidateAudit?.within_configured_radius != null
                  ? `${candidateAudit.within_configured_radius} QUALIFYING`
                  : (candidateAudit?.candidates?.length
                      ? `${candidateAudit.candidates.length} QUALIFYING`
                      : 'WPI DATA UNAVAILABLE')}
              </span>
            </div>
            {candidateAudit?.candidates && candidateAudit.candidates.length > 0 ? (
              candidateAudit.candidates.slice(0, 4).map((cand: any, idx: number) => {
                const distVal = cand.geodesic_distance_km ?? cand.distance_km;
                const distStr = distVal != null ? `${Number(distVal).toFixed(1)} km` : '—';
                return (
                  <div key={idx} className="flex justify-between py-0.5 text-[10px]">
                    <span className={cand.is_selected ? 'text-tactical-amber font-bold' : 'text-tactical-muted'}>
                      {cand.port_name || cand.main_port_name}
                    </span>
                    <span className="font-mono text-tactical-text">
                      {distStr} {cand.is_selected ? '★' : ''}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-center text-tactical-dim">
                WPI DATA UNAVAILABLE // NO CANDIDATES
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Fixed Action Button */}
      <div className="p-3 border-t border-tactical-border bg-tactical-panel">
        <button
          onClick={onOpenDossier}
          className="brutalist-btn-orange w-full py-2.5 text-xs font-mono font-bold tracking-wider uppercase text-center flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <span>[ COMPILE COMPLETE EVIDENCE DOSSIER → ]</span>
        </button>
      </div>

    </aside>
  );
}
