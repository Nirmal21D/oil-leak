'use client';

import React from 'react';

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
  observedCoordinates?: { lat: number; lon: number };
  releaseCoordinates?: { lat: number; lon: number };
  sourceLabel?: string;
  onOpenDossier?: () => void;
  onSelectModule?: (moduleId: string) => void;
}

export default function IncidentHero({
  areaKm2 = 14.8,
  volumeM3 = 31.8,
  sensitivityKm = 3.5,
  priorityScore = 93.1,
  primarySuspectName = 'MT OCEAN PIONEER',
  perimeterKm = 28.4,
  compactness = 0.23,
  estimatedMassTons = 27.7,
  thicknessUm = 2.12,
  observedCoordinates = { lat: 19.4120, lon: 71.3250 },
  releaseCoordinates = { lat: 19.4733, lon: 71.2097 },
  sourceLabel = 'MODEL-DERIVED',
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
            MUMBAI HIGH PLATFORM BASIN // ARABIAN SEA
          </span>
          <span className="text-concrete-600 hidden sm:inline">•</span>
          <span className="text-concrete-400 text-[11px] hidden sm:inline font-mono">
            {observedCoordinates.lat.toFixed(4)}° N, {observedCoordinates.lon.toFixed(4)}° E (T0) →{' '}
            <strong className="text-safety-orange">
              {releaseCoordinates.lat.toFixed(4)}° N, {releaseCoordinates.lon.toFixed(4)}° E (T-6.5H)
            </strong>
          </span>
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
              {areaKm2.toFixed(1)}{' '}
              <span className="text-xs font-bold text-concrete-500 font-mono">KM²</span>
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            PERIMETER: {perimeterKm.toFixed(1)} KM<br />COMPACTNESS: {compactness.toFixed(2)}
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
              {volumeM3.toFixed(1)}{' '}
              <span className="text-xs font-bold text-concrete-500 font-mono">M³</span>
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            ~{estimatedMassTons.toFixed(1)} METRIC TONS<br />THICKNESS: {thicknessUm.toFixed(2)} μM
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
              ±{sensitivityKm.toFixed(1)}{' '}
              <span className="text-xs font-bold text-safety-orange/70 font-mono">KM</span>
            </div>
          </div>
          <span className="text-[10px] text-concrete-600 hidden xl:block text-right">
            ±20% WIND/CUR VAR<br />MAX DISPL: 3.18 KM
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
              {priorityScore.toFixed(1)}{' '}
              <span className="text-xs font-bold text-concrete-500 font-mono">/ 100</span>
            </div>
          </div>
          <span className="text-[10px] text-concrete-400 hidden xl:block text-right font-bold">
            LEAD: {primarySuspectName}<br />
            <span className="text-[9px] text-concrete-600 font-normal">NOT GUILT</span>
          </span>
        </div>
      </div>
    </section>
  );
}
