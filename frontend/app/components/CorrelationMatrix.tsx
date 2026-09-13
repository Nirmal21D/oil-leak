'use client';

import React from 'react';
import { Table, EyeOff } from 'lucide-react';

interface CorrelationMatrixProps {
  suspects: any[];
  darkVessels?: any[];
  onSelectVessel?: (vessel: any) => void;
}

export default function CorrelationMatrix({
  suspects = [],
  darkVessels = [],
  onSelectVessel
}: CorrelationMatrixProps) {
  return (
    <div className="bg-[#111622] border border-[#232d45] rounded-xl p-4 space-y-3 font-mono select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#1c2438] pb-2.5">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            AIS SPATIO-TEMPORAL CORRELATION MATRIX <span className="text-slate-500 font-normal">| AUDIT LOG</span>
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 bg-[#161d2d] px-2.5 py-0.5 rounded border border-[#232d45]">
          ALGORITHM: HAIL-CPA v1.4
        </span>
      </div>

      {/* Correlation Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-[10px] text-slate-400 border-b border-[#232d45] uppercase tracking-widest bg-[#0b0e14]">
              <th className="p-2.5">VESSEL / ID</th>
              <th className="p-2.5">TYPE</th>
              <th className="p-2.5">CPA DIST</th>
              <th className="p-2.5">HDG</th>
              <th className="p-2.5">SOG</th>
              <th className="p-2.5 text-right">RISK INDEX</th>
              <th className="p-2.5 text-center">AUDIT STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c2438]">
            {/* Candidate AIS Vessels */}
            {suspects.map((vessel: any, idx: number) => {
              const vName = vessel.vessel_name || vessel.name;
              const vId = vessel.vessel_id || `SYN-AIS-${idx + 1}`;
              const dist = vessel.distance_km ?? 1.8;
              const scorePct = vessel.attribution_score_pct ?? 85.0;
              const isPrimary = scorePct >= 80.0;

              return (
                <tr
                  key={vId}
                  onClick={() => onSelectVessel && onSelectVessel(vessel)}
                  className={`hover:bg-[#161d2d] cursor-pointer transition ${
                    isPrimary ? 'bg-red-500/5 text-slate-200' : 'text-slate-300'
                  }`}
                >
                  <td className="p-2.5 font-bold flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-red-500 animate-pulse' : 'bg-sky-400'}`}></span>
                    <div>
                      <div className={isPrimary ? 'text-slate-100 font-bold' : 'text-slate-300'}>{vName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{vId} • MMSI: {vessel.mmsi || 'N/A'}</div>
                    </div>
                  </td>

                  <td className="p-2.5 text-slate-400">{vessel.vessel_type || 'Tanker'}</td>
                  
                  <td className="p-2.5 font-bold text-slate-200">
                    {dist} km <span className="text-[10px] text-slate-500 font-normal">({isPrimary ? 'Offset' : 'Cleared'})</span>
                  </td>

                  <td className="p-2.5 text-slate-300">{vessel.heading_deg || 126.5}° T</td>

                  <td className="p-2.5 text-slate-300">{vessel.speed_knots || 12.4} kn</td>

                  <td className="p-2.5 text-right font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isPrimary ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-[#161d2d] text-slate-400 border border-[#232d45]'
                    }`}>
                      {scorePct.toFixed(1)} {isPrimary ? 'PRIORITY' : 'LOW'}
                    </span>
                  </td>

                  <td className="p-2.5 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      isPrimary ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-[#161d2d] text-slate-400 border border-[#232d45]'
                    }`}>
                      {isPrimary ? 'INVESTIGATIVE LEAD' : 'CLEARED'}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Dark Vessels (CFAR Detected) */}
            {darkVessels.map((dv: any) => (
              <tr
                key={dv.dark_target_id}
                onClick={() => onSelectVessel && onSelectVessel({
                  ...dv,
                  vessel_id: dv.dark_target_id,
                  vessel_name: dv.dark_target_id,
                  vessel_type: 'Dark Target (SAR CFAR)',
                  mmsi: 'BLACKOUT',
                  flag: 'UNVERIFIED',
                  attribution_score_pct: dv.risk_index_pct,
                  distance_km: dv.cpa_dist_km,
                  risk_level: 'HIGH RISK'
                })}
                className="bg-amber-500/5 text-slate-200 hover:bg-[#161d2d] cursor-pointer transition border-l-2 border-amber-500"
              >
                <td className="p-2.5 font-bold flex items-center space-x-2.5">
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-slate-200 font-bold">{dv.dark_target_id}</div>
                    <div className="text-[10px] text-slate-500 font-normal">SAR CFAR Radar Target (RCS: {dv.rcs_db} dB)</div>
                  </div>
                </td>

                <td className="p-2.5 text-slate-400">Unidentified SAR Target</td>

                <td className="p-2.5 font-bold text-slate-200">{dv.cpa_dist_km} km</td>

                <td className="p-2.5 text-slate-500">--</td>

                <td className="p-2.5 text-slate-500">--</td>

                <td className="p-2.5 text-right">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {dv.risk_index_pct}% DARK
                  </span>
                </td>

                <td className="p-2.5 text-center">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    AIS BLACKOUT
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
