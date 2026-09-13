'use client';

import React from 'react';

interface CFARRadarPanelProps {
  darkVessels?: any[];
  onSelectVessel?: (vessel: any) => void;
}

export default function CFARRadarPanel({
  darkVessels = [],
  onSelectVessel,
}: CFARRadarPanelProps) {
  const target = darkVessels[0] || {
    dark_target_id: 'DARK-TARGET-04',
    rcs_db: 18.5,
    cpa_dist_km: 2.1,
    risk_index_pct: 88.2,
  };

  return (
    <section id="cfar" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-amber-400 border border-amber-500/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            05 // CFAR RADAR RECONNAISSANCE
          </span>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            CONSTANT FALSE ALARM RATE (CFAR) TARGET EXTRACTION
          </h3>
        </div>
        <span className="stamp-tag border-amber-500 text-amber-400 font-bold">
          AIS-UNMATCHED CANDIDATE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left 2 Cols: Radar Data Sheet */}
        <div className="md:col-span-2 bg-concrete-900 border border-concrete-700 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
              [TARGET] {target.dark_target_id} // RADAR CROSS SECTION ANALYTICS
            </span>
            <span className="text-[10px] text-concrete-500 font-mono">
              THRESHOLD: &gt; 14.2 dB BACKGROUND
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">SAR BACKSCATTER</span>
              <strong className="text-amber-400 font-mono text-base font-black">
                {target.rcs_db} dB
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">RCS: ~18.5 dBsm</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">CPA TO SLICK</span>
              <strong className="text-concrete-100 font-mono text-base font-black">
                {target.cpa_dist_km} KM
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">OFFSET PROXIMITY</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">AIS STATUS</span>
              <strong className="text-red-400 font-mono text-sm font-black">
                BLACKOUT
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">ZERO PINGS IN 12H</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">PRIORITY SCORE</span>
              <strong className="text-amber-400 font-mono text-base font-black">
                {target.risk_index_pct}
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">DEMO VALUE</span>
            </div>
          </div>

          <p className="text-[11px] text-concrete-400 leading-relaxed bg-concrete-950 p-3 border border-concrete-800">
            <strong>Radar Physics Note:</strong> High metallic backscatter anomalies (σ₀ &gt; 14.2 dB) isolated against dark sea clutter indicate uncooperative commercial or non-reporting maritime hulls. Target does not prove deliberate transponder disabling.
          </p>
        </div>

        {/* Right 1 Col: Action & Status Card */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-concrete-800 pb-2 mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
                AUDIT ACTIONS
              </span>
              <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                TACTICAL
              </span>
            </div>
            <div className="space-y-2 text-xs text-concrete-400">
              <div>• Target Type: Unregistered Radar Echo</div>
              <div>• Acquisition Swath: Sentinel-1 IW C-band</div>
              <div>• Hull Length Est.: 140–180 meters</div>
            </div>
          </div>

          <button
            onClick={() =>
              onSelectVessel &&
              onSelectVessel({
                vessel_id: target.dark_target_id,
                vessel_name: target.dark_target_id,
                vessel_type: 'AIS-Unmatched Target (CFAR Radar)',
                flag: 'UNVERIFIED',
                mmsi: 'BLACKOUT',
                cpa_dist_km: target.cpa_dist_km,
                distance_km: target.cpa_dist_km,
                attribution_score_pct: target.risk_index_pct,
                risk_level: 'HIGH RISK',
              })
            }
            className="brutalist-btn w-full py-2 bg-concrete-800 hover:bg-concrete-700 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider text-center"
          >
            [ AUDIT DARK TARGET IN C2 → ]
          </button>
        </div>
      </div>
    </section>
  );
}
