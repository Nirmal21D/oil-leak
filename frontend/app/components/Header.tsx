'use client';

import React from 'react';
import { Shield, Radar, AlertTriangle, Database, Activity } from 'lucide-react';

interface HeaderProps {
  apiStatus: string;
  isBackendConnected: boolean;
}

export default function Header({ apiStatus, isBackendConnected }: HeaderProps) {
  return (
    <header className="bg-ocean-800/80 backdrop-blur border-b border-ocean-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-200 bg-clip-text text-transparent">
            AegisSea Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            SAR Oil Spill Detection & Multi-Signal AIS Vessel Attribution Engine
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-ocean-900/60 border border-ocean-700 text-xs">
          <Radar className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-slate-300">Region: <strong className="text-cyan-300">Mumbai High (19.4°N, 71.3°E)</strong></span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Activity className={`w-4 h-4 ${isBackendConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-400">Engine API:</span>
          <span className={`px-2 py-0.5 rounded font-mono font-medium ${
            isBackendConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {apiStatus}
          </span>
        </div>
      </div>
    </header>
  );
}
