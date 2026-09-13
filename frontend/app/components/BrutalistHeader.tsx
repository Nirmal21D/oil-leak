'use client';

import React, { useState, useEffect } from 'react';

interface BrutalistHeaderProps {
  apiStatus: string;
  isBackendConnected: boolean;
  telemetry?: any;
  incidentCoordinates?: { lat: number; lon: number };
  onOpenDossier?: () => void;
}

export default function BrutalistHeader({
  apiStatus,
  isBackendConnected,
  telemetry,
  incidentCoordinates = { lat: 19.4733, lon: 71.2097 },
  onOpenDossier,
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

  return (
    <header className="bg-concrete-950 border-b-2 border-concrete-700 text-concrete-100 select-none sticky top-0 z-50">
      {/* Sleek Single-Row Tactical Header */}
      <div className="px-4 py-2 bg-concrete-900 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono">
        {/* Left: System Nomenclature */}
        <div className="flex items-center space-x-3">
          <div className="bg-safety-orange text-concrete-950 px-2 py-0.5 font-bold tracking-wider text-[11px]">
            AEGISSEA // PS-26143
          </div>
          <span className="text-concrete-500 font-bold hidden sm:inline">|</span>
          <span className="text-concrete-300 font-mono tracking-tight text-[11px] hidden sm:inline">
            NTRO MARITIME RECONNAISSANCE & ATTRIBUTION C2
          </span>
          <span className="stamp-tag border-concrete-600 text-concrete-400 text-[9px] hidden md:inline">
            CLASSIFIED // PROTOTYPE
          </span>
        </div>

        {/* Center: Incident Geo Reference */}
        <div className="flex items-center space-x-2 text-[11px] tracking-tight">
          <span className="text-concrete-500">INCIDENT:</span>
          <strong className="text-concrete-100 font-bold">INC-001</strong>
          <span className="text-concrete-600 font-bold">•</span>
          <span className="text-concrete-400 font-mono">{incidentCoordinates.lat.toFixed(4)}° N / {incidentCoordinates.lon.toFixed(4)}° E</span>
          <span className="text-concrete-600 font-bold">•</span>
          <span className="text-concrete-400">MUMBAI HIGH SECTOR</span>
        </div>

        {/* Right: Environmental Telemetry, Engine State & UTC Chrono */}
        <div className="flex items-center space-x-3 text-[11px]">
          {/* Quick Telemetry Indicators */}
          <div className="hidden xl:flex items-center space-x-3 text-concrete-400 border-r border-concrete-800 pr-3">
            <div>
              <span className="text-concrete-600">WIND:</span>{' '}
              <strong className="text-concrete-200">{telemetry?.wind || '14.0 kts'}</strong>
            </div>
            <div>
              <span className="text-concrete-600">CUR:</span>{' '}
              <strong className="text-concrete-200">{telemetry?.current || '1.2 kts'}</strong>
            </div>
            <div>
              <span className="text-concrete-600">TIDE:</span>{' '}
              <strong className="text-safety-orange">M2</strong>
            </div>
          </div>

          {/* GPU Hardware Status */}
          <div className="flex items-center space-x-1.5 border border-concrete-700 px-2 py-0.5 bg-concrete-950">
            <span
              className={`w-2 h-2 inline-block ${
                isBackendConnected ? 'bg-safety-orange animate-pulse' : 'bg-concrete-600'
              }`}
            />
            <span className="text-concrete-400">GPU:</span>
            <span className={`font-bold ${isBackendConnected ? 'text-concrete-100' : 'text-concrete-400'}`}>
              {isBackendConnected ? 'RTX 3050 CUDA' : 'OFFLINE'}
            </span>
          </div>

          {/* UTC Clock */}
          <div className="border border-concrete-700 px-2 py-0.5 bg-concrete-950 text-concrete-300 font-bold tracking-wider font-mono">
            {timeUtc}
          </div>
        </div>
      </div>
    </header>
  );
}
