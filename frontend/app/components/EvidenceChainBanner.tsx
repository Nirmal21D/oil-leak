'use client';

import React from 'react';
import { formatCoordinate } from '../utils/geo';

interface EvidenceChainBannerProps {
  scenarioData?: any;
  detectionResult?: any;
  activePhase?: 'overview' | 'sar' | 'drift' | 'ais' | 'responder';
  onSelectPhase?: (phase: 'overview' | 'sar' | 'drift' | 'ais' | 'responder') => void;
}

export default function EvidenceChainBanner({
  scenarioData,
  detectionResult,
  activePhase,
  onSelectPhase,
}: EvidenceChainBannerProps) {
  const isReal = scenarioData?.is_historical_real ?? true;
  const areaVal = detectionResult?.morphology?.area_sq_km ?? scenarioData?.detected_slick?.area_sq_km;
  const topCandidate = scenarioData?.ranked_suspects?.[0];
  const routing = scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing;
  const selectedPort = routing?.selected_port;

  const steps = [
    {
      id: 'sar',
      step: '01',
      phase: 'OBSERVED',
      title: 'SENTINEL-1 SAR',
      highlight: areaVal != null ? `SLICK DETECTED · ${Number(areaVal).toFixed(1)} KM²` : (detectionResult ? 'SLICK SEGMENTED' : 'AWAITING SENSOR INGEST'),
      detail: scenarioData?.telemetry?.metocean_query_time ? `${scenarioData.telemetry.metocean_query_time} · Raw Tensor` : (detectionResult ? 'Raw Tensor & Mask' : 'STANDBY'),
      color: 'border-tactical-amber text-tactical-amber',
      accent: 'text-tactical-amber',
    },
    {
      id: 'overview',
      step: '02',
      phase: 'INFERRED',
      title: 'SLICK GEOMETRY',
      highlight: 'MORPHOLOGY & FAY VOL.',
      detail: scenarioData?.location
        ? `${formatCoordinate(scenarioData.location.lat, scenarioData.location.lon)}${scenarioData.detected_slick?.estimated_volume_m3 ? ` · ${Number(scenarioData.detected_slick.estimated_volume_m3).toFixed(1)} M³` : ''}`
        : (detectionResult?.slick_centroid ? `${formatCoordinate(detectionResult.slick_centroid.lat, detectionResult.slick_centroid.lon)}` : 'STANDBY'),
      color: 'border-tactical-amber text-tactical-amber',
      accent: 'text-tactical-amber',
    },
    {
      id: 'drift',
      step: '03',
      phase: 'MODELED',
      title: 'CMEMS + LAGRANGIAN',
      highlight: scenarioData?.reconstructed_release ? 'RELEASE LOCUS T-6.5H' : 'DRIFT MODEL',
      detail: scenarioData?.reconstructed_release
        ? `${formatCoordinate(scenarioData.reconstructed_release.lat, scenarioData.reconstructed_release.lon)} · ±3.5 KM`
        : 'STANDBY',
      color: 'border-tactical-cyan text-tactical-cyan',
      accent: 'text-tactical-cyan',
    },
    {
      id: 'ais',
      step: '04',
      phase: 'CORRELATED',
      title: isReal ? 'NOAA AIS ARCHIVE' : 'AIS CORRELATION',
      highlight: topCandidate
        ? `${topCandidate.vessel_name || 'LEAD CANDIDATE'} (${(topCandidate.attribution_score_pct ?? topCandidate.score_index ?? 0).toFixed(1)} / 100)`
        : (scenarioData ? 'AIS DATA UNAVAILABLE' : 'STANDBY'),
      detail: topCandidate
        ? `${scenarioData?.ais_provenance?.unique_vessels_tracked ? `${scenarioData.ais_provenance.unique_vessels_tracked} Ships · ` : ''}Traj: ${(topCandidate.trajectory_score ?? 0).toFixed(3)}`
        : 'STANDBY',
      color: 'border-tactical-amber text-tactical-amber',
      accent: 'text-tactical-amber',
    },
    {
      id: 'responder',
      step: '05',
      phase: 'RESPONDER',
      title: 'NGA WPI (PUB 150)',
      highlight: selectedPort ? selectedPort.port_name.toUpperCase() : (routing ? 'WPI EVALUATED' : 'RESPONSE INFRA'),
      detail: selectedPort?.geodesic_distance_km != null
        ? `${Number(selectedPort.geodesic_distance_km).toFixed(1)} KM · ${routing?.routing_status || 'GEODESIC FALLBACK'}`
        : (routing ? (routing.routing_status || 'NOT ESTABLISHED') : 'STANDBY'),
      color: 'border-tactical-cyan text-tactical-cyan',
      accent: 'text-tactical-cyan',
    },
  ];

  return (
    <section className="w-full bg-tactical-navy border-t border-tactical-border px-3 lg:px-4 py-2.5 font-mono select-none">
      <div className="max-w-[1920px] mx-auto space-y-1.5">
        
        {/* Banner Title Bar */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-2">
            <span className="text-tactical-amber font-black tracking-widest uppercase">
              EXECUTIVE EVIDENCE CHAIN
            </span>
            <span className="text-tactical-dim font-bold">//</span>
            <span className="text-tactical-muted uppercase hidden sm:inline">
              PARALLEL SENSOR OBSERVATION → REASONING → RECONSTRUCTION → LOGISTICS
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-tactical-dim text-[9px] hidden md:inline">CLICK PHASE TO NAVIGATE WORKSPACE:</span>
            <span className={`stamp-tag ${scenarioData ? 'border-tactical-green text-tactical-green' : 'border-tactical-dim text-tactical-dim'} text-[9px] px-1.5 py-0.2`}>
              {scenarioData ? '● CHAIN ACTIVE' : '○ STANDBY'}
            </span>
          </div>
        </div>

        {/* 5 Connected Step Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {steps.map((s, idx) => {
            const isSelected = activePhase === s.id;
            return (
              <button
                key={s.step}
                onClick={() => onSelectPhase && onSelectPhase(s.id as any)}
                className={`text-left p-2.5 border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-tactical-amber bg-tactical-panel ring-1 ring-tactical-amber'
                    : 'border-tactical-border bg-tactical-panel/80 hover:bg-tactical-panel hover:border-tactical-muted'
                }`}
              >
                {/* Step Index & Phase Badge */}
                <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1 mb-1">
                  <span className="text-[10px] text-tactical-dim font-bold">{s.step} //</span>
                  <span className={`text-[9px] font-black tracking-wider uppercase ${s.accent}`}>
                    {s.phase}
                  </span>
                </div>

                {/* Card Title & Highlight */}
                <div className="space-y-0.5 my-0.5">
                  <div className="text-[10px] text-tactical-muted font-bold truncate">
                    {s.title}
                  </div>
                  <div className={`text-xs font-black truncate ${isSelected ? 'text-tactical-amber' : 'text-tactical-text'}`}>
                    {s.highlight}
                  </div>
                </div>

                {/* Sub-detail */}
                <div className="text-[9px] text-tactical-dim truncate pt-1 border-t border-tactical-border/40">
                  {s.detail}
                </div>

                {/* Arrow Connector on desktop */}
                {idx < steps.length - 1 && (
                  <span className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-tactical-border text-xs font-bold pointer-events-none">
                    ▶
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
