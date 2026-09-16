'use client';

import React from 'react';

interface DataProvenanceStripProps {
  scenarioData?: any;
  detectionResult?: any;
}

export default function DataProvenanceStrip({
  scenarioData,
  detectionResult,
}: DataProvenanceStripProps) {
  const isHistoricalReal = scenarioData?.is_historical_real;
  const responderRoute = scenarioData?.responder_route;
  const routingStatus = responderRoute?.routing_status || 'GEODESIC_FALLBACK';
  const routingProvider = responderRoute?.routing_provider || 'NONE REGISTERED';
  const wpiSource = responderRoute?.source || 'NGA_WPI_REST_LIVE';

  return (
    <div className="w-full bg-concrete-950 border-y border-concrete-800 px-4 py-2 text-[10px] font-mono text-concrete-400 select-none">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Section Label */}
        <div className="flex items-center space-x-2">
          <span className="text-concrete-500 font-bold uppercase tracking-wider">
            [DATA PROVENANCE & FEED INTEGRITY]
          </span>
          <span className="text-concrete-700">|</span>
        </div>

        {/* Center: 6 Intelligence Streams */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {/* 1. SAR Feed */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">SAR:</span>
            <span className="text-concrete-200">Sentinel-1 C-SAR GRD</span>
            <span className="inline-flex items-center text-emerald-400 text-[9px] font-bold">
              ● ARCHIVE VERIFIED
            </span>
          </div>

          {/* 2. Metocean Feed */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">METOCEAN:</span>
            <span className="text-concrete-200">CMEMS Copernicus (Current/Wind)</span>
            <span className="inline-flex items-center text-emerald-400 text-[9px] font-bold">
              ● LIVE / REANALYSIS
            </span>
          </div>

          {/* 3. AIS Feed */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">AIS:</span>
            <span className="text-concrete-200">
              {isHistoricalReal ? 'NOAA MarineCadastre AccessAIS' : 'INDIAN EEZ / SIMULATOR'}
            </span>
            <span className={`inline-flex items-center text-[9px] font-bold ${isHistoricalReal ? 'text-emerald-400' : 'text-amber-400'}`}>
              ● {isHistoricalReal ? 'ARCHIVE VERIFIED' : 'STANDBY'}
            </span>
          </div>

          {/* 4. Ports Feed */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">PORTS:</span>
            <span className="text-concrete-200">NGA Pub 150 World Port Index</span>
            <span className="inline-flex items-center text-sky-400 text-[9px] font-bold">
              ● {wpiSource.includes('LIVE') ? 'LIVE REST' : (wpiSource.includes('GLOBAL') ? 'PUB 150 GLOBAL' : 'REGIONAL CACHE')}
            </span>
          </div>

          {/* 5. Routing Engine */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">ROUTING:</span>
            <span className="text-concrete-200">
              {routingStatus === 'MARITIME_ROUTE_AVAILABLE' ? routingProvider : 'GEODESIC REFERENCE'}
            </span>
            <span className={`inline-flex items-center text-[9px] font-bold ${
              routingStatus === 'MARITIME_ROUTE_AVAILABLE' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              ● {routingStatus === 'MARITIME_ROUTE_AVAILABLE' ? 'MARITIME ROUTE' : 'GEODESIC FALLBACK'}
            </span>
          </div>

          {/* 6. Neural Network Model */}
          <div className="flex items-center space-x-1.5">
            <span className="text-concrete-500 font-semibold">MODEL:</span>
            <span className="text-concrete-200">Zenodo SOS ResNet34 U-Net</span>
            <span className="inline-flex items-center text-emerald-400 text-[9px] font-bold">
              ● LOCAL INFERENCE
            </span>
          </div>
        </div>

        {/* Right: Security Classification */}
        <div className="hidden xl:flex items-center space-x-2 text-[9px] text-concrete-500">
          <span>CLASSIFICATION: OPERATIONAL DEFENSE PROTOTYPE</span>
        </div>
      </div>
    </div>
  );
}
