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
  onOpenDossier,
  scenarioData,
  detectionResult,
  activeLayers = {},
  onToggleLayer,
}: TacticalSidebarProps) {
  const hasIncident = Boolean(
    detectionResult ||
    (scenarioData && scenarioData.status !== 'standby' && (scenarioData.scenario_id || scenarioData.incident_id || scenarioData.location))
  );
  const isAisReal = scenarioData?.is_historical_real ?? Boolean(scenarioData?.ais_provenance?.provider?.includes('NOAA'));

  const layerItems = [
    { key: 'slick', label: 'SAR Slick Polygon', color: 'text-tactical-amber' },
    { key: 'drift', label: 'Lagrangian Drift Vector', color: 'text-tactical-cyan' },
    { key: 'ais', label: 'AIS Vessel Contacts', color: 'text-emerald-400' },
    { key: 'responder', label: 'Response Routing & Ports', color: 'text-sky-400' },
    { key: 'infra', label: 'Maritime Infrastructure', color: 'text-tactical-muted' },
  ];

  return (
    <aside className="w-full lg:w-[240px] shrink-0 bg-tactical-navy border border-tactical-border flex flex-col justify-between select-none font-sans text-xs">
      {/* Top Section: Branding & Incident Identity */}
      <div className="p-3 space-y-3.5">
        {/* Console Brand */}
        <div className="border-b border-tactical-border pb-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-tight text-tactical-text uppercase font-display">
              AEGISSEA
            </span>
            <span className={`stamp-tag text-[9px] ${hasIncident ? 'border-tactical-green text-tactical-green' : 'border-tactical-dim text-tactical-dim'} px-1.5 py-0.2`}>
              {hasIncident ? '● SCENE ACTIVE' : '○ STANDBY'}
            </span>
          </div>
          <span className="text-[10px] text-tactical-muted font-mono tracking-wider block mt-0.5">
            MARITIME TACTICAL C2 // NTRO
          </span>
        </div>

        {/* Current Incident Profile */}
        <div className="bg-tactical-panel border border-tactical-border p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-tactical-dim uppercase">INCIDENT PROFILE</span>
            <span className="text-tactical-amber font-bold">
              {hasIncident ? (scenarioData?.scenario_id || scenarioData?.incident_id || 'ACTIVE') : 'STANDBY'}
            </span>
          </div>
          {hasIncident ? (
            <>
              <div className="font-bold text-tactical-text text-xs uppercase font-display tracking-tight truncate">
                {scenarioData?.sector || 'OFFSHORE SECTOR'}
              </div>
              <div className="text-[10px] text-tactical-muted font-mono">
                {scenarioData?.location?.lat != null && scenarioData?.location?.lon != null
                  ? formatCoordinate(scenarioData.location.lat, scenarioData.location.lon)
                  : (detectionResult?.slick_centroid
                      ? formatCoordinate(detectionResult.slick_centroid.lat, detectionResult.slick_centroid.lon)
                      : 'COORDINATES LOADED')}
              </div>
              <div className="text-[9px] text-tactical-dim font-mono">
                {scenarioData?.telemetry?.metocean_query_time || scenarioData?.release_window?.observation_time_utc || 'INGEST RECORDED'}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-tactical-muted font-mono py-1">
              Awaiting incident sensor ingest.
            </div>
          )}
        </div>

        {/* Primary Action: 7-Page Evidence Dossier */}
        <div>
          <button
            onClick={onOpenDossier}
            className="w-full text-left px-2.5 py-2 transition-colors flex items-center justify-between border border-tactical-border bg-tactical-panel text-tactical-text hover:border-tactical-amber hover:text-tactical-amber cursor-pointer shadow-sm"
          >
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-tactical-amber">📄</span>
              <span className="text-xs font-bold uppercase">EVIDENCE DOSSIER</span>
            </div>
            <span className="text-[9px] bg-tactical-base border border-tactical-amber text-tactical-amber font-mono font-bold px-1.5 py-0.2">
              7-PAGE ↗
            </span>
          </button>
        </div>

        {/* Tactical Map Display Layers */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-tactical-dim tracking-wider uppercase block px-1">
            TACTICAL MAP LAYERS
          </span>
          <div className="bg-tactical-panel border border-tactical-border p-2 space-y-1.5 font-mono text-[10px]">
            {layerItems.map((item) => {
              const isChecked = activeLayers[item.key] ?? true;
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between cursor-pointer hover:text-tactical-text"
                >
                  <span className={`flex items-center space-x-1.5 ${isChecked ? 'text-tactical-text' : 'text-tactical-dim'}`}>
                    <span className={item.color}>•</span>
                    <span>{item.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleLayer && onToggleLayer(item.key)}
                    className="accent-amber-500 w-3 h-3 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Semantic Data Sources Telemetry */}
        <div className="border-t border-tactical-border pt-2.5 space-y-1.5">
          <span className="text-[10px] font-mono text-tactical-dim tracking-wider uppercase block px-1">
            DATA FEEDS & PROVENANCE
          </span>
          <div className="space-y-1 font-mono text-[10px] bg-tactical-panel border border-tactical-border p-2">
            <div className="flex items-center justify-between">
              <span className="text-tactical-muted">SAR RADAR:</span>
              <span className="text-tactical-green flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">S-1A C-SAR</span>
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
              <span className="text-tactical-muted">PORTS:</span>
              <span className="text-tactical-green flex items-center space-x-1">
                <span>●</span>
                <span className="text-[9px]">NGA PUB 150</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: System Status & Cryptographic Hash */}
      <div className="p-3 border-t border-tactical-border bg-tactical-base/80 space-y-1 font-mono text-[10px]">
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
