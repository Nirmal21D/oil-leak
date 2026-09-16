'use client';

import React, { useState } from 'react';
import { AlertCircle, EyeOff, Anchor, CheckCircle2, FileText, Info } from 'lucide-react';
import DossierModal from './DossierModal';

interface SuspectVessel {
  rank: number;
  vessel_name: string;
  mmsi: number | null;
  imo: number | null;
  vessel_type: string;
  flag: string;
  proximity_km: number;
  trajectory_alignment_score: number;
  overall_attribution_score: number;
  ais_status: string;
  dark_vessel_flag: boolean;
}

interface AttributionPanelProps {
  suspects: SuspectVessel[];
  infraData?: any;
  detectionResult?: any;
}

export default function AttributionPanel({ suspects, infraData, detectionResult }: AttributionPanelProps) {
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  return (
    <>
      <div className="bg-ocean-800/60 backdrop-blur border border-ocean-700 rounded-xl p-5 space-y-5 flex flex-col h-full">
        {/* Header & Synthetic Data Banner */}
        <div className="space-y-2 border-b border-ocean-700/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">Attribution Analysis & Candidate Ranking</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              {suspects.length} Candidates Screened
            </span>
          </div>

          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-between text-[11px]">
            <span className="text-amber-300 font-semibold">Synthetic AIS Benchmark Track (Demonstration Data)</span>
            <span className="text-slate-400 font-mono text-[10px]">σ=3.5km, σ=25°</span>
          </div>
        </div>

        {/* Candidate Suspect List */}
        {suspects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-ocean-900/40 rounded-lg border border-ocean-700/60 space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 border border-blue-500/20">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">No Candidate AIS Tracks Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Connect backend AIS stream to screen candidate vessels along regional maritime shipping lanes.
              </p>
            </div>
          </div>
        ) : (
          /* Ranked Suspect List */
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {suspects.map((vessel: any, idx: number) => {
              const rank = idx + 1;
              const vName = vessel.vessel_name || vessel.name;
              const vId = vessel.vessel_id || vessel.id || `SYN-AIS-${idx + 1}`;
              const vType = vessel.vessel_type || 'Tanker';
              const flag = vessel.flag || 'Panama';
              const mmsi = vessel.mmsi || 'SYN-MMSI-419';
              const dist = vessel.distance_km ?? vessel.proximity_km ?? 1.8;
              const scorePct = vessel.attribution_score_pct ?? (vessel.overall_attribution_score ? vessel.overall_attribution_score * 100 : 85);
              const riskLevel = vessel.risk_level || (rank === 1 ? 'PRIMARY SUSPECT' : 'LOW RISK');

              return (
                <div
                  key={vId}
                  className={`p-3.5 rounded-lg border transition-all ${
                    rank === 1
                      ? 'bg-red-950/30 border-red-500/50 hover:border-red-500/80 shadow-lg'
                      : 'bg-ocean-900/50 border-ocean-700/60 hover:border-ocean-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                          rank === 1 ? 'bg-red-500 text-white' : 'bg-ocean-700 text-slate-300'
                        }`}>
                          #{rank}
                        </span>
                        <h3 className="font-bold text-slate-100">{vName}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ocean-700 text-cyan-300 border border-ocean-600">
                          {vId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {vType} • Flag: {flag} • MMSI: {mmsi}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Match Score</div>
                      <div className={`text-base font-mono font-extrabold ${
                        scorePct >= 80 ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {scorePct.toFixed(1)}%
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        rank === 1 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] bg-ocean-900/70 p-2 rounded border border-ocean-800 font-mono">
                    <div>
                      <span className="text-slate-500">Dist to Origin:</span>{' '}
                      <strong className="text-slate-200">{dist} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Track Status:</span>{' '}
                      <strong className="text-cyan-300">{vessel.ais_status || 'Active Track'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infrastructure Check Footer & Export Button */}
        {infraData && (
          <div className="pt-3 border-t border-ocean-700/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Field Check: <strong>{infraData.nearest_rig}</strong> ({infraData.distance_km} km)</span>
            </div>
            <button
              onClick={() => setIsDossierOpen(true)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        )}
      </div>

      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        infraData={infraData}
        detectionResult={detectionResult}
      />
    </>
  );
}
