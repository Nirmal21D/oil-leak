'use client';

import React from 'react';
import { formatCoordinate } from '../utils/geo';

interface TacticalSidebarProps {
  activeModule: 'overview' | 'sar' | 'drift' | 'ais' | 'responder';
  onSelectModule: (module: 'overview' | 'sar' | 'drift' | 'ais' | 'responder') => void;
  onOpenDossier: () => void;
  scenarioData?: any;
  detectionResult?: any;
  activeLayers?: Record<string, boolean>;
  onToggleLayer?: (layerKey: string) => void;
}

export default function TacticalSidebar({
  activeModule,
  onSelectModule,
  onOpenDossier,
  scenarioData,
  detectionResult,
  activeLayers,
  onToggleLayer,
}: TacticalSidebarProps) {
  const isSarLoaded = Boolean(detectionResult?.mask_base64 || scenarioData?.detected_slick);
  const slickAreaKm2 = detectionResult?.morphology?.area_sq_km ?? scenarioData?.detected_slick?.area_sq_km;
  const uniqueVessels = scenarioData?.ais_provenance?.unique_vessels_tracked;
  const routing = scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing;
  const wpiNum = routing?.selected_port?.wpi_number;
  const isAisReal = scenarioData?.is_historical_real ?? Boolean(scenarioData?.ais_provenance?.provider?.includes('NOAA'));

  const navItems = [
    { id: 'overview', label: '01  OVERVIEW', badge: scenarioData ? 'ACTIVE' : 'STANDBY' },
    { id: 'sar', label: '02  SAR OBSERVATION', badge: slickAreaKm2 != null ? `${Number(slickAreaKm2).toFixed(1)} KM²` : (isSarLoaded ? 'LOADED' : 'STANDBY') },
    { id: 'drift', label: '03  DRIFT MODEL', badge: scenarioData?.reconstructed_release ? 'T-6.5H' : 'STANDBY' },
    { id: 'ais', label: '04  AIS CORRELATION', badge: uniqueVessels != null ? `${uniqueVessels} SHIPS` : (scenarioData ? 'AIS N/A' : 'STANDBY') },
    { id: 'responder', label: '05  RESPONSE INFRA', badge: wpiNum ? `WPI #${wpiNum}` : (routing ? 'FALLBACK' : 'STANDBY') },
  ];

  return (
    <aside className="w-full lg:w-[240px] shrink-0 bg-tactical-navy border border-tactical-border flex flex-col justify-between select-none font-sans text-xs">
      {/* Top Section: Branding & Incident Identity */}
      <div className="p-3 space-y-4">
        {/* Console Brand */}
        <div className="border-b border-tactical-border pb-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-tight text-tactical-text uppercase font-display">
              AEGISSEA
            </span>
            <span className={`stamp-tag text-[9px] ${scenarioData ? 'border-tactical-green text-tactical-green' : 'border-tactical-dim text-tactical-dim'} px-1.5 py-0.2`}>
              {scenarioData ? '● SCENE ACTIVE' : '○ STANDBY'}
            </span>
          </div>
          <span className="text-[10px] text-tactical-muted font-mono tracking-wider block mt-0.5">
            MARITIME TACTICAL C2 // NTRO
          </span>
        </div>

        {/* Current Incident Profile */}
        <div className="bg-tactical-panel border border-tactical-border p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-tactical-dim uppercase">INCIDENT IDENTIFIER</span>
            <span className="text-tactical-amber font-bold">
              {scenarioData?.scenario_id || scenarioData?.incident_id || 'STANDBY // NO INCIDENT'}
            </span>
          </div>
          <div className="font-bold text-tactical-text text-xs uppercase font-display tracking-tight truncate">
            {scenarioData?.sector || (scenarioData ? 'MARITIME ZONE' : 'AWAITING SENSOR INGEST')}
          </div>
          <div className="text-[10px] text-tactical-muted font-mono">
            {scenarioData?.location?.lat != null && scenarioData?.location?.lon != null
              ? formatCoordinate(scenarioData.location.lat, scenarioData.location.lon)
              : (detectionResult?.slick_centroid
                  ? formatCoordinate(detectionResult.slick_centroid.lat, detectionResult.slick_centroid.lon)
                  : 'STANDBY')}
          </div>
          <div className="text-[9px] text-tactical-dim font-mono">
            {scenarioData?.telemetry?.metocean_query_time || scenarioData?.release_window?.observation_time_utc || 'AWAITING INGEST'}
          </div>
        </div>

        {/* Investigation Navigation Modules */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-tactical-dim tracking-wider uppercase block px-1 pb-0.5">
            INVESTIGATION PHASES
          </span>
          <nav className="space-y-0.5 font-mono">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id as any)}
                  className={`w-full text-left px-2.5 py-2 transition-colors flex items-center justify-between border cursor-pointer ${
                    isActive
                      ? 'bg-tactical-amber text-tactical-base font-bold border-tactical-amber'
                      : 'bg-tactical-panel text-tactical-muted border-tactical-border hover:text-tactical-text hover:bg-tactical-hover'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 ${
                      isActive
                        ? 'bg-tactical-base text-tactical-amber font-bold'
                        : 'text-tactical-dim'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}

            {/* Evidence Dossier Action Button */}
            <button
              onClick={onOpenDossier}
              className="w-full text-left px-2.5 py-2 mt-1 transition-colors flex items-center justify-between border border-tactical-border bg-tactical-panel text-tactical-text hover:border-tactical-amber hover:text-tactical-amber cursor-pointer"
            >
              <span className="text-xs font-bold font-mono">06  EVIDENCE DOSSIER</span>
              <span className="text-[9px] text-tactical-amber font-mono font-bold">7-PAGE ↗</span>
            </button>
          </nav>
        </div>

        {/* Semantic Data Sources Telemetry */}
        <div className="border-t border-tactical-border pt-3 space-y-2">
          <span className="text-[10px] font-mono text-tactical-dim tracking-wider uppercase block px-1">
            DATA FEEDS & PROVENANCE
          </span>
          <div className="space-y-1.5 font-mono text-[10px] bg-tactical-panel border border-tactical-border p-2">
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">SAR RADAR:</span>
              <span className="text-tactical-green flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">VERIFIED (S-1A)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">METOCEAN:</span>
              <span className="text-tactical-cyan flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">CMEMS REANALYSIS</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">AIS ARCHIVE:</span>
              <span className="text-tactical-green flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">{isAisReal ? 'NOAA ACCESSAIS' : 'SIMULATOR'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">PORTS REGISTRY:</span>
              <span className="text-tactical-green flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">NGA PUB 150</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">ROUTING:</span>
              <span className="text-tactical-amber flex items-center space-x-1">
                <span>⚠</span>
                <span className="text-[9px]">GEODESIC FALLBACK</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: System Status & Cryptographic Hash */}
      <div className="p-3 border-t border-tactical-border bg-tactical-base/80 space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-tactical-dim">
          <span>MODEL INFERENCE:</span>
          <span className="text-tactical-text font-bold">RESNET-34 U-NET</span>
        </div>
        <div className="flex items-center justify-between text-tactical-dim">
          <span>COMPUTE BACKEND:</span>
          <span className="text-tactical-green font-bold">CUDA ACCELERATED</span>
        </div>
        <div className="flex items-center justify-between text-tactical-dim pt-1 border-t border-tactical-border/60">
          <span>DATA INTEGRITY:</span>
          <span className="text-tactical-amber font-bold">SHA-256 SEALED</span>
        </div>
      </div>
    </aside>
  );
}
