'use client';

import React, { useState, useEffect } from 'react';
import { formatCoordinate } from '../utils/geo';

interface BrutalistHeaderProps {
  apiStatus: string;
  isBackendConnected: boolean;
  telemetry?: any;
  incidentCoordinates?: { lat: number; lon: number } | null;
  sectorLabel?: string;
  incidentId?: string;
  onOpenDossier?: () => void;
  onRunGolden?: () => void;
  isProcessing?: boolean;
}

export default function BrutalistHeader({
  apiStatus,
  isBackendConnected,
  telemetry,
  incidentCoordinates = null,
  sectorLabel,
  incidentId = 'STANDBY',
  onOpenDossier,
  onRunGolden,
  isProcessing = false,
}: BrutalistHeaderProps) {
  const [timeUtc, setTimeUtc] = useState<string>('00:00:00 UTC');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const coordsFormatted = incidentCoordinates
    ? formatCoordinate(incidentCoordinates.lat, incidentCoordinates.lon)
    : 'STANDBY // AWAITING SENSOR INGEST';

  return (
    <header className="bg-tactical-navy border-b border-tactical-border text-tactical-text select-none sticky top-0 z-50 font-mono">
      <div className="px-3 lg:px-4 py-2 flex flex-wrap items-center justify-between gap-y-2 text-xs">
        
        {/* Left: Tactical Console Title & Scene Verification Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-tight text-tactical-text font-display uppercase">
              AEGISSEA
            </span>
            <span className="text-tactical-dim font-bold">/</span>
            <span className="text-tactical-muted font-bold text-xs tracking-wider uppercase">
              MARITIME INTELLIGENCE & TACTICAL C2
            </span>
          </div>

          <span className={`stamp-tag ${isBackendConnected && incidentCoordinates ? 'border-tactical-green text-tactical-green' : 'border-tactical-dim text-tactical-dim'} bg-tactical-panel text-[9px] px-2 py-0.5`}>
            {incidentCoordinates ? '● SCENE ACTIVE' : '○ STANDBY'}
          </span>
        </div>

        {/* Center: Incident Coordinates & Observation Timestamp */}
        <div className="flex items-center space-x-3 text-[11px] text-tactical-muted">
          <div>
            <span className="text-tactical-dim">INCIDENT: </span>
            <strong className="text-tactical-amber font-bold">{incidentId}</strong>
          </div>
          <span className="text-tactical-border">•</span>
          <div>
            <span className="text-tactical-dim">LOCUS: </span>
            <strong className="text-tactical-text">{coordsFormatted}</strong>
          </div>
          <span className="text-tactical-border hidden md:inline">•</span>
          <div className="hidden md:block">
            <span className="text-tactical-dim">ACQUIRED: </span>
            <span className="text-tactical-text">
              {telemetry?.metocean_query_time || (incidentCoordinates ? 'AWAITING SENSOR INGEST' : 'STANDBY')}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Triggers & System Clock */}
        <div className="flex items-center space-x-2">
          {onRunGolden && (
            <button
              onClick={onRunGolden}
              disabled={isProcessing}
              className="brutalist-btn-orange px-2.5 py-1 text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? '⚡ PROCESSING...' : '⚡ RUN GOLDEN: 00111 (NOAA AIS)'}</span>
            </button>
          )}

          {onOpenDossier && (
            <button
              onClick={onOpenDossier}
              className="brutalist-btn px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider hover:text-tactical-amber cursor-pointer"
            >
              <span>[ 📄 EVIDENCE DOSSIER ]</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-1.5 pl-2 text-tactical-muted text-[11px] border-l border-tactical-border">
            <span className="text-tactical-dim">CLOCK:</span>
            <span className="text-tactical-text font-bold">{timeUtc}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
