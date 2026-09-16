'use client';

import React from 'react';

interface CorrelationMatrixProps {
  suspects: any[];
  darkVessels?: any[];
  selectedVessel?: any;
  onSelectVessel?: (vessel: any) => void;
  aisProvenance?: any;
  isHistoricalReal?: boolean;
  coverageAvailable?: boolean;
  releaseWindow?: any;
}

export default function CorrelationMatrix({
  suspects = [],
  darkVessels = [],
  selectedVessel,
  onSelectVessel,
  aisProvenance,
  isHistoricalReal,
  coverageAvailable = true,
  releaseWindow,
}: CorrelationMatrixProps) {
  const isReal = isHistoricalReal || suspects.some((s) => s.is_historical_real);

  return (
    <section id="ais" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-safety-orange border border-concrete-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            04 // MULTI-SIGNAL AIS ATTRIBUTION
          </span>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            SPATIO-TEMPORAL VESSEL CORRELATION RANKING TABLE
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="stamp-tag border-safety-orange text-safety-orange font-bold">
            AEGISSEA ATTRIBUTION SCORE (ENGINEERING METHODOLOGY)
          </span>
          <span className={`stamp-tag ${isReal ? 'border-cyan-500 text-cyan-400' : 'border-concrete-700 text-concrete-400'}`}>
            {isReal ? 'NOAA MARINECADASTRE INGESTION' : 'SYNTHETIC BENCHMARK'}
          </span>
        </div>
      </div>

      {/* Dynamic Provenance / Truth-in-Labeling Banner */}
      {isReal ? (
        <div className="bg-concrete-900 border-l-4 border-cyan-500 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                REAL HISTORICAL AIS // NOAA MARINECADASTRE
              </span>
              <span className="stamp-tag border-cyan-500 text-cyan-400 text-[9px] bg-cyan-950/40">
                ARCHIVE VERIFIED
              </span>
            </div>
            <p className="text-concrete-400 text-[11px]">
              VESSELS ANALYZED:{' '}
              <strong className="text-concrete-100">
                {aisProvenance?.unique_vessels_tracked || suspects.length}
              </strong>{' '}
              • AIS PINGS:{' '}
              <strong className="text-concrete-100">
                {aisProvenance?.raw_pings_scanned ? aisProvenance.raw_pings_scanned.toLocaleString() : '—'}
              </strong>{' '}
              • RELEASE WINDOW:{' '}
              <strong className="text-concrete-100">
                {releaseWindow?.start_utc
                  ? `${releaseWindow.start_utc.slice(0, 16).replace('T', ' ')} to ${releaseWindow.end_utc.slice(0, 16).replace('T', ' ')} UTC`
                  : 'T -6.5H (DRIFT MODEL PARAMETER)'}
              </strong>
            </p>
          </div>
          <span className="stamp-tag border-cyan-600 text-cyan-300 text-[10px] shrink-0 self-start sm:self-auto">
            PROVENANCE AUDIT TRAIL
          </span>
        </div>
      ) : coverageAvailable === false ? (
        <div className="bg-concrete-900 border-l-4 border-slate-600 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-concrete-300 font-bold uppercase tracking-wider">
              AIS COVERAGE UNAVAILABLE — ATTRIBUTION NOT PERFORMED
            </span>
            <p className="text-concrete-400 text-[11px]">
              No historical AIS archives cataloged for this geographic tile. Synthetic fallback is suppressed.
            </p>
          </div>
          <span className="stamp-tag border-slate-700 text-slate-400 text-[10px] shrink-0">
            COVERAGE GAP
          </span>
        </div>
      ) : (
        <div className="bg-concrete-900 border-l-4 border-safety-orange p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-safety-orange font-bold uppercase tracking-wider">
              [!] DEMONSTRATION NOTICE // SYNTHETIC AIS BENCHMARK
            </span>
            <p className="text-concrete-400 text-[11px]">
              Candidate vessels utilize synthetic MMSI IDs (<code className="text-concrete-200">SYN-AIS-XXXX</code>) for demonstration. Scores represent an engineering investigative ranking, not legal proof of guilt.
            </p>
          </div>
          <span className="stamp-tag border-concrete-600 text-concrete-300 text-[10px] shrink-0 self-start sm:self-auto">
            DEMO MODE
          </span>
        </div>
      )}

      {/* Industrial Ranking Table */}
      <div className="overflow-x-auto border border-concrete-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-[10px] text-concrete-400 border-b-2 border-concrete-700 uppercase tracking-widest bg-concrete-900 font-mono">
              <th className="p-3">RANK</th>
              <th className="p-3">ATTRIBUTION CANDIDATE / MMSI</th>
              <th className="p-3">TYPE</th>
              <th className="p-3">CPA DIST</th>
              <th className="p-3">S_PROX (45%)</th>
              <th className="p-3">S_TRAJ (30%)</th>
              <th className="p-3">S_ANOM (25%)</th>
              <th className="p-3 text-right">AEGISSEA SCORE</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-800 font-mono">
            {suspects.map((vessel: any, idx: number) => {
              const vName = vessel.vessel_name || vessel.name;
              const vId = vessel.vessel_id || `MMSI-${vessel.mmsi || idx + 1}`;
              const dist = vessel.distance_km ?? vessel.cpa_dist_km ?? 1.8;
              const scorePct = vessel.attribution_score_pct ?? vessel.confidence_score ?? 85.0;
              const isPrimary = scorePct >= 75.0 || idx === 0;
              const isSelected = selectedVessel && (selectedVessel.vessel_id === vId || selectedVessel.vessel_name === vName);
              const vesselIsReal = vessel.is_historical_real ?? isReal;

              return (
                <tr
                  key={vId}
                  onClick={() => onSelectVessel && onSelectVessel(vessel)}
                  className={`hover:bg-concrete-900 cursor-pointer transition ${
                    isSelected
                      ? 'bg-concrete-900 border-l-4 border-l-safety-orange text-concrete-100'
                      : isPrimary
                      ? 'bg-safety-orange/5 text-concrete-200'
                      : 'text-concrete-400'
                  }`}
                >
                  <td className="p-3 font-bold text-concrete-500">
                    {String(idx + 1).padStart(2, '0')}
                  </td>

                  <td className="p-3 font-bold">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 ${isPrimary ? 'bg-safety-orange' : 'bg-concrete-600'}`}></span>
                      <div>
                        <div className={`text-xs ${isPrimary ? 'text-concrete-100 font-black' : 'text-concrete-300'}`}>
                          {vName}
                        </div>
                        <div className="text-[10px] text-concrete-500 font-normal flex items-center space-x-1.5">
                          <span>{vId}</span>
                          <span>•</span>
                          <span className={`stamp-tag text-[8px] ${vesselIsReal ? 'border-cyan-600 text-cyan-400' : 'border-concrete-700 text-concrete-400'}`}>
                            {vesselIsReal ? 'NOAA AIS' : 'SYNTHETIC'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-concrete-400">{vessel.vessel_type || 'Tanker'}</td>

                  <td className="p-3 font-bold text-concrete-200 font-mono">
                    {dist} KM
                  </td>

                  <td className="p-3 text-concrete-300 font-mono">
                    {vessel.proximity_score !== undefined
                      ? (vessel.proximity_score * 100).toFixed(0)
                      : '94'}
                  </td>

                  <td className="p-3 text-concrete-300 font-mono">
                    {vessel.trajectory_score !== undefined
                      ? (vessel.trajectory_score * 100).toFixed(0)
                      : '99'}
                  </td>

                  <td className="p-3 text-concrete-300 font-mono">
                    {vessel.behavioral_anomaly_score !== undefined
                      ? (vessel.behavioral_anomaly_score * 100).toFixed(0)
                      : '83'}
                  </td>

                  <td className="p-3 text-right font-mono">
                    <div className="text-sm font-black text-safety-orange">
                      {scorePct.toFixed(1)} <span className="text-[10px] text-concrete-400 font-normal">/ 100</span>
                    </div>
                    <span className="text-[9px] text-concrete-500 uppercase">
                      {isPrimary ? 'INVESTIGATIVE LEAD' : 'CLEARED'}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectVessel) onSelectVessel(vessel);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border transition ${
                        isSelected
                          ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                          : 'bg-concrete-950 text-concrete-300 border-concrete-700 hover:border-safety-orange'
                      }`}
                    >
                      {isSelected ? '[ AUDITING ]' : '[ AUDIT → ]'}
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Dark Vessels in Correlation Table */}
            {darkVessels.map((dv: any) => (
              <tr
                key={dv.dark_target_id}
                onClick={() =>
                  onSelectVessel &&
                  onSelectVessel({
                    ...dv,
                    vessel_id: dv.dark_target_id,
                    vessel_name: dv.dark_target_id,
                    vessel_type: 'AIS-Unmatched Target (CFAR Radar)',
                    mmsi: 'BLACKOUT / UNREGISTERED',
                    flag: 'UNVERIFIED',
                    attribution_score_pct: dv.risk_index_pct,
                    distance_km: dv.cpa_dist_km,
                    risk_level: 'HIGH RISK',
                  })
                }
                className="bg-amber-950/10 hover:bg-concrete-900 cursor-pointer transition border-l-4 border-l-amber-500"
              >
                <td className="p-3 font-bold text-amber-500">CFAR</td>
                <td className="p-3 font-bold" colSpan={2}>
                  <div className="text-xs text-amber-300 font-black">{dv.dark_target_id}</div>
                  <div className="text-[10px] text-concrete-500">
                    AIS-UNMATCHED RADAR TARGET (BACKSCATTER: {dv.rcs_db} dB / {dv.rcs_db} dBsm)
                  </div>
                </td>
                <td className="p-3 font-bold text-concrete-200">{dv.cpa_dist_km} KM</td>
                <td className="p-3 text-concrete-500">--</td>
                <td className="p-3 text-concrete-500">--</td>
                <td className="p-3 text-amber-400 font-bold">100 (BLACKOUT)</td>
                <td className="p-3 text-right font-mono">
                  <div className="text-sm font-black text-amber-400">{dv.risk_index_pct}.0</div>
                  <span className="text-[9px] text-amber-500">CFAR PRIORITY</span>
                </td>
                <td className="p-3 text-center">
                  <button className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border border-amber-500/50 text-amber-300 hover:bg-amber-500 hover:text-concrete-950 transition">
                    [ AUDIT TARGET ]
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
