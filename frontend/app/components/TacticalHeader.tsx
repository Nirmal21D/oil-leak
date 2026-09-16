'use client';

import React from 'react';
import { Shield, Radio, Wind, Waves, Thermometer, Layers } from 'lucide-react';

interface TacticalHeaderProps {
  apiStatus: string;
  isBackendConnected: boolean;
  telemetry?: any;
  activeLayers: Record<string, boolean>;
  toggleLayer: (layerKey: string) => void;
}

export default function TacticalHeader({
  apiStatus,
  isBackendConnected,
  telemetry,
  activeLayers,
  toggleLayer
}: TacticalHeaderProps) {
  return (
    <header className="bg-[#0b0e14] border-b border-[#232d45] text-slate-100 font-mono select-none">
      {/* Top Banner Row */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#1c2438] bg-[#111622]">
        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 bg-sky-950 text-sky-400 font-bold text-xs tracking-wider rounded border border-sky-500/30 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>AEGISSEA C2 CONSOLE</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 flex items-center space-x-1.5 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SYSTEM ONLINE / S1-SAR LOCKED</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">INCIDENT: <strong className="text-slate-200">INC-20260913-0091</strong></span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">SECTOR: <strong className="text-slate-200">DYNAMIC OFFSHORE SECTOR</strong></span>
          </div>
        </div>

        {/* Telemetry & API Engine */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="hidden lg:flex items-center space-x-4 text-slate-400 border-r border-[#1c2438] pr-4">
            <div className="flex items-center space-x-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              <span>{telemetry?.wind || '14.0 kts @ 065°'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span>Cur: {telemetry?.current || '1.2 kts @ 065°'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-slate-400" />
              <span>SST: {telemetry?.sea_temp_c || '28.4'}°C</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#161d2d] border border-[#232d45]">
            <Radio className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] text-slate-400">ENGINE:</span>
            <span className={`font-bold ${isBackendConnected ? 'text-emerald-400' : 'text-slate-300'}`}>{apiStatus}</span>
          </div>
        </div>
      </div>

      {/* Layer Toggle Pills Bar (Consistent Neutral Slate Pills with Ice-Blue Active Highlight) */}
      <div className="px-4 py-1.5 bg-[#0b0e14] flex items-center space-x-2 overflow-x-auto text-[11px] font-mono border-b border-[#1c2438]">
        <span className="text-slate-500 font-bold uppercase flex items-center space-x-1 pr-2 text-[10px] tracking-wider">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>LAYERS:</span>
        </span>

        <button
          onClick={() => toggleLayer('slick_mask')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.slick_mask
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          ■ SLICK MASK
        </button>

        <button
          onClick={() => toggleLayer('drift_cone')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.drift_cone
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          ▲ DRIFT CONE
        </button>

        <button
          onClick={() => toggleLayer('ais_tracks')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.ais_tracks
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          ≈ AIS TRACKS
        </button>

        <button
          onClick={() => toggleLayer('dark_vessels')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.dark_vessels
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          👁 DARK VESSELS (CFAR)
        </button>

        <button
          onClick={() => toggleLayer('responder_intercept')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.responder_intercept
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          ⚓ RESPONDER INTERCEPT
        </button>

        <button
          onClick={() => toggleLayer('bathymetry')}
          className={`px-3 py-1 rounded border font-semibold transition ${
            activeLayers.bathymetry
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
              : 'bg-[#111622] text-slate-400 border-[#232d45] hover:text-slate-200'
          }`}
        >
          🌊 BATHYMETRY
        </button>
      </div>
    </header>
  );
}
