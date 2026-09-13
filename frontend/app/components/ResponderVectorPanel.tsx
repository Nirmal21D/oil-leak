'use client';

import React, { useState } from 'react';

interface ResponderVectorPanelProps {
  responderRoute?: any;
}

export default function ResponderVectorPanel({
  responderRoute,
}: ResponderVectorPanelProps) {
  const [sitrepSent, setSitrepSent] = useState<boolean>(false);

  const handleTransmitSitrep = () => {
    setSitrepSent(true);
    setTimeout(() => setSitrepSent(false), 3000);
  };

  return (
    <section id="responder" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            06 // COAST GUARD TACTICAL VECTOR
          </span>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            GEODESIC INTERCEPT ROUTING & CONTAINMENT VECTORING
          </h3>
        </div>
        <span className="stamp-tag border-emerald-500 text-emerald-400 font-bold">
          EST. GEODESIC ETA: T+4.1H
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Intercept Telemetry */}
        <div className="lg:col-span-2 bg-concrete-900 border border-concrete-700 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              [ASSET] ICG POLLUTION CONTROL VESSEL (DEMONSTRATION ASSET)
            </span>
            <span className="text-[10px] text-concrete-500 font-mono">
              STATION: MUMBAI PORT BASE (18.9438° N, 72.8360° E)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">DISTANCE TO SLICK</span>
              <strong className="text-concrete-100 font-mono text-base font-black">
                167.0 KM
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">90.2 NAUTICAL MILES</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">TRANSIT SPEED</span>
              <strong className="text-concrete-100 font-mono text-base font-black">
                22.0 KNOTS
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">40.7 KM/H SUSTAINED</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">TIME TO INTERCEPT</span>
              <strong className="text-emerald-400 font-mono text-base font-black">
                T+4.1 HOURS
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">~246 MINUTES</span>
            </div>

            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">BOOM DEPLOYMENT</span>
              <strong className="text-concrete-100 font-mono text-base font-black">
                2,000 METERS
              </strong>
              <span className="text-[9px] text-concrete-600 block mt-0.5">OFFSHORE SKIMMER</span>
            </div>
          </div>

          {/* Operational Route Vector Chain */}
          <div className="bg-concrete-950 border border-concrete-800 p-3 text-xs space-y-1">
            <div className="text-concrete-500 text-[10px] font-bold uppercase">
              TACTICAL DECISION-SUPPORT CHAIN:
            </div>
            <div className="flex flex-wrap items-center gap-2 text-concrete-300 font-mono text-[11px]">
              <span>MUMBAI BASE (T0)</span>
              <span className="text-concrete-600">→</span>
              <span>GREAT CIRCLE GEODESIC VECTOR (167 KM)</span>
              <span className="text-concrete-600">→</span>
              <span className="text-emerald-400 font-bold">INTERCEPT WAYPOINT (T+4.1H)</span>
              <span className="text-concrete-600">→</span>
              <span className="text-safety-orange font-bold">PROTECT RAIGAD ESTUARY ECOSYSTEM</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Actions & Dispatch */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-concrete-800 pb-2 mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
                SITREP COMMAND
              </span>
              <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                DEMO
              </span>
            </div>
            <p className="text-[11px] text-concrete-400 leading-relaxed">
              Dispatches automated maritime situation report with target GPS coordinates, weather forecasts, and containment deployment plans to Coast Guard operations center.
            </p>
          </div>

          <button
            onClick={handleTransmitSitrep}
            className={`brutalist-btn w-full py-2.5 px-4 font-mono font-bold text-xs tracking-wider uppercase transition text-center ${
              sitrepSent
                ? 'bg-emerald-600 text-concrete-950 border-emerald-500'
                : 'bg-concrete-800 hover:bg-concrete-700 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {sitrepSent
              ? '[ SITREP DISPATCHED TO COAST GUARD (DEMO) ✓ ]'
              : '[ TRANSMIT SITREP DISPATCH (DEMO) → ]'}
          </button>
        </div>
      </div>
    </section>
  );
}
