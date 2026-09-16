'use client';

import React from 'react';
import { formatCoordinate } from '../utils/geo';

interface IncidentHeroProps {
  areaKm2?: number;
  volumeM3?: number;
  sensitivityKm?: number;
  priorityScore?: number;
  primarySuspectName?: string;
  perimeterKm?: number;
  compactness?: number;
  estimatedMassTons?: number;
  thicknessUm?: number;
  observedCoordinates?: { lat: number; lon: number } | null;
  releaseCoordinates?: { lat: number; lon: number } | null;
  sourceLabel?: string;
  incidentTitle?: string;
  onOpenDossier?: () => void;
  onSelectModule?: (moduleId: string) => void;
}

export default function IncidentHero({
  areaKm2,
  volumeM3,
  sensitivityKm,
  priorityScore,
  primarySuspectName,
  perimeterKm,
  compactness,
  estimatedMassTons,
  thicknessUm,
  observedCoordinates = null,
  releaseCoordinates = null,
  sourceLabel = 'MODEL-DERIVED',
  incidentTitle,
  onOpenDossier,
  onSelectModule,
}: IncidentHeroProps) {
  return (
    <section className="bg-concrete-950 border-b border-concrete-700 text-concrete-100 select-none">
      {/* Streamlined Incident Headline Bar */}
      <div className="px-4 py-2 border-b border-concrete-800 bg-concrete-900 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-safety-orange text-concrete-950 px-2 py-0.5 font-bold tracking-wider uppercase text-[10px]">
            INCIDENT 01
          </span>
          <span className="font-extrabold text-concrete-100 uppercase tracking-tight text-xs">
            {incidentTitle || (observedCoordinates ? `OFFSHORE OIL SPILL // ${formatCoordinate(observedCoordinates.lat, observedCoordinates.lon)}` : 'STANDBY // AWAITING SENSOR INGEST')}
          </span>
          {observedCoordinates && (
            <>
              <span className="text-concrete-600 hidden sm:inline">•</span>
              <span className="text-concrete-400 text-[11px] hidden sm:inline font-mono">
                {formatCoordinate(observedCoordinates.lat, observedCoordinates.lon)} (T0)
                {releaseCoordinates && (
                  <>
                    {' → '}
                    <strong className="text-safety-orange">
                      {formatCoordinate(releaseCoordinates.lat, releaseCoordinates.lon)} (T-6.5H)
                    </strong>
                  </>
                )}
              </span>
            </>
          )}
          <span className="stamp-tag border-safety-orange text-safety-orange text-[9px] uppercase">
            {sourceLabel}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenDossier}
          className="brutalist-btn-orange px-3 py-1 font-mono text-[11px] font-bold tracking-wider uppercase transition"
        >
          [ GENERATE INCIDENT DOSSIER → ]
        </button>
      </div>

      {/* Compact 4-Column Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-concrete-800 font-mono">
        {/* Metric 1: Surface Area */}
        <div
          onClick={() => onSelectModule && onSelectModule('sar')}
          className="px-4 py-2 bg-concrete-950 hover:bg-concrete-900 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-concrete-500 font-bold tracking-wider block">
              01 // SURFACE AREA (±15%)
            </span>
            <div className="text-xl xl:text-2xl font-black text-concrete-100 font-display mt-0.5">
              {areaKm2 != null ? (
                <>
                  {Number(areaKm2).toFixed(1)}{' '}
                  <span className="text-xs font-bold text-concrete-500 font-mono">KM²</span>
                </>
              ) : (
                <span className="text-sm text-concrete-500 font-mono">STANDBY</span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            {perimeterKm != null ? `PERIMETER: ${Number(perimeterKm).toFixed(1)} KM` : 'PERIMETER: —'}<br />
            {compactness != null ? `COMPACTNESS: ${Number(compactness).toFixed(2)}` : 'COMPACTNESS: —'}
          </span>
        </div>

        {/* Metric 2: Estimated Volume */}
        <div
          onClick={() => onSelectModule && onSelectModule('drift')}
          className="px-4 py-2 bg-concrete-950 hover:bg-concrete-900 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-concrete-500 font-bold tracking-wider block">
              02 // EST. VOLUME (FAY)
            </span>
            <div className="text-xl xl:text-2xl font-black text-concrete-100 font-display mt-0.5">
              {volumeM3 != null ? (
                <>
                  {Number(volumeM3).toFixed(1)}{' '}
                  <span className="text-xs font-bold text-concrete-500 font-mono">M³</span>
                </>
              ) : (
                <span className="text-sm text-concrete-500 font-mono">STANDBY</span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            {estimatedMassTons != null ? `~${Number(estimatedMassTons).toFixed(1)} METRIC TONS` : '~— METRIC TONS'}<br />
            {thicknessUm != null ? `THICKNESS: ${Number(thicknessUm).toFixed(2)} μM` : 'THICKNESS: —'}
          </span>
        </div>

        {/* Metric 3: Origin Uncertainty Envelope */}
        <div
          onClick={() => onSelectModule && onSelectModule('drift')}
          className="px-4 py-2 bg-concrete-950 hover:bg-concrete-900 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-safety-orange font-bold tracking-wider block">
              03 // SENSITIVITY ENVELOPE
            </span>
            <div className="text-xl xl:text-2xl font-black text-safety-orange font-display mt-0.5">
              {sensitivityKm != null ? (
                <>
                  ±{Number(sensitivityKm).toFixed(1)}{' '}
                  <span className="text-xs font-bold text-safety-orange/70 font-mono">KM</span>
                </>
              ) : (
                <span className="text-sm text-concrete-500 font-mono">STANDBY</span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            ±20% WIND/CUR VAR<br />MAX DISPL: {sensitivityKm != null ? '3.18 KM' : '—'}
          </span>
        </div>

        {/* Metric 4: Investigative Priority Index */}
        <div
          onClick={() => onSelectModule && onSelectModule('attribution')}
          className="px-4 py-2 bg-concrete-950 hover:bg-concrete-900 transition cursor-pointer flex items-center justify-between border-l-2 border-l-safety-orange"
        >
          <div>
            <span className="text-[10px] text-concrete-300 font-bold tracking-wider block">
              04 // PRIORITY INDEX (HEURISTIC)
            </span>
            <div className="text-xl xl:text-2xl font-black text-safety-orange font-display mt-0.5">
              {priorityScore != null ? (
                <>
                  {Number(priorityScore).toFixed(1)}{' '}
                  <span className="text-xs font-bold text-concrete-500 font-mono">/ 100</span>
                </>
              ) : (
                <span className="text-sm text-concrete-500 font-mono">STANDBY</span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-concrete-400 hidden xl:block text-right font-bold">
            LEAD: {primarySuspectName || 'STANDBY'}<br />
            <span className="text-[9px] text-concrete-500 font-normal">HEURISTIC RANKING</span>
          </span>
        </div>
      </div>
    </section>
  );
}
