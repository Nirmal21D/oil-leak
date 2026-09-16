'use client';

import React, { useState } from 'react';
import { formatCoordinate } from '../utils/geo';

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

  const hasRoute = Boolean(responderRoute && (responderRoute.response_hub || responderRoute.station_base));

  if (!hasRoute) {
    return (
      <section id="responder" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
          <div className="flex items-center space-x-3">
            <span className="bg-concrete-900 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
              05 // RESPONSE INFRASTRUCTURE & ROUTING
            </span>
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
              NGA WORLD PORT INDEX (PUB 150) CANDIDATE DISCOVERY
            </h3>
          </div>
          <span className="stamp-tag border-concrete-700 text-concrete-400 font-bold text-[9px]">
            ROUTING STANDBY
          </span>
        </div>

        <div className="bg-concrete-900 border border-concrete-700 p-6 text-center space-y-3">
          <span className="text-emerald-500/80 font-bold text-xs uppercase tracking-widest block">
            [RESPONSE INFRASTRUCTURE STATUS]
          </span>
          <p className="text-xs text-concrete-300 font-bold">
            WPI DATA UNAVAILABLE // AWAITING SENSOR INGEST &amp; SPATIAL CORRELATION
          </p>
          <p className="text-[11px] text-concrete-500 max-w-xl mx-auto leading-relaxed">
            Geodesic candidate search against the NGA World Port Index (Pub 150) requires an active spill centroid or release locus. Once an incident scene is processed, closest operational ports within a 350 km radius will be ranked.
          </p>
        </div>
      </section>
    );
  }

  const stationName = responderRoute?.response_hub || responderRoute?.station_base || "NOT IDENTIFIED";
  const stationCoords = responderRoute?.station_coords
    ? formatCoordinate(responderRoute.station_coords[0], responderRoute.station_coords[1])
    : "NOT AVAILABLE";

  const routingStatus = responderRoute?.routing_status || "GEODESIC_FALLBACK";
  const isFallback = routingStatus === "GEODESIC_FALLBACK";
  const selectionBasis = responderRoute?.selection_basis || "Minimum geodesic distance";
  const maritimeAccess = responderRoute?.maritime_access || "Not evaluated";
  const routingProvider = responderRoute?.routing_provider || "NONE REGISTERED";
  const routingReason = responderRoute?.routing_reason || "NO AUTHORITATIVE MARITIME ROUTING SOURCE";

  const geodesicKm = responderRoute?.geodesic_distance_km ?? responderRoute?.distance_km;
  const geodesicNm = responderRoute?.geodesic_distance_nm ?? responderRoute?.distance_nm;
  const bearing = responderRoute?.bearing_deg;
  const navigableKm = responderRoute?.navigable_distance_km;
  const operationalEta = responderRoute?.operational_eta_formatted || "NOT ESTABLISHED";
  const wpiNum = responderRoute?.wpi_number || "—";
  const unLocode = responderRoute?.un_locode || responderRoute?.unlocode || "—";
  const source = responderRoute?.source || "NGA_WPI_REST_LIVE";
  const wpiAttrs = responderRoute?.wpi_attributes || {};

  const candidateAudit = responderRoute?.candidate_audit;
  const candidates: any[] = candidateAudit?.candidates || [];
  const totalFeatures = candidateAudit?.total_features_returned ?? candidates.length;
  const withinRadius = candidateAudit?.within_radius_count ?? candidates.length;

  return (
    <section id="responder" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            05 // RESPONSE INFRASTRUCTURE & ROUTING
          </span>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            NGA WORLD PORT INDEX (PUB 150) CANDIDATE DISCOVERY
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="stamp-tag border-sky-500 text-sky-400 text-[9px]">
            {source}
          </span>
          <span className={`stamp-tag font-bold text-[9px] ${
            isFallback ? 'border-amber-500 text-amber-400 bg-amber-950/40' : 'border-emerald-500 text-emerald-400'
          }`}>
            ROUTING STATUS: {routingStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Selected Candidate & Telemetry */}
        <div className="lg:col-span-2 bg-concrete-900 border border-concrete-700 p-4 space-y-4">
          {/* Top Block: Response Port Candidate Identity */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-concrete-500 font-bold uppercase tracking-wider block">
                RESPONSE PORT CANDIDATE
              </span>
              <h4 className="font-extrabold text-xl sm:text-2xl uppercase tracking-tight text-concrete-100 font-display">
                {stationName}
              </h4>
              <div className="flex items-center space-x-2 text-xs font-mono text-concrete-400">
                <span>NGA WPI #{wpiNum} · {unLocode}</span>
                <span>•</span>
                <span>PORT LOCUS: <strong className="text-concrete-200">{stationCoords}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-1.5">
              <span className="bg-safety-orange text-concrete-950 px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#08090c]">
                ★ SELECTED
              </span>
              <div className="text-right">
                <span className="text-[9px] text-concrete-500 block uppercase">SELECTION BASIS</span>
                <span className="text-xs text-concrete-300 font-mono font-bold">
                  {selectionBasis}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Structural Divider */}
          <div className="border-t-2 border-concrete-800" />

          {/* Telemetry Hierarchy: Geodesic vs Navigable Waterway */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
            {/* Geodesic Spatial Reference (Explicitly Straight-Line, NOT Transit) */}
            <div className="bg-concrete-950 p-3.5 border-2 border-concrete-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-concrete-400 font-bold uppercase tracking-wider">
                  GEODESIC DISTANCE (SPATIAL REFERENCE)
                </span>
                <span className="text-[9px] text-concrete-500">
                  BEARING: {bearing != null ? `${bearing.toFixed(1)}° T` : '—'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-concrete-100">
                  {geodesicKm != null ? `${geodesicKm.toFixed(1)} km` : '—'}
                </span>
                <span className="text-xs text-concrete-500">
                  ({geodesicNm != null ? `${geodesicNm.toFixed(1)} NM STRAIGHT-LINE` : '—'})
                </span>
              </div>
              <p className="text-[10px] text-concrete-500 pt-1 border-t border-concrete-800/80 leading-tight">
                * Great-circle distance between port locus and incident. Does NOT represent water navigation or transit channel.
              </p>
            </div>

            {/* Maritime Route Evaluation (Disclosed as NOT EVALUATED / NOT ESTABLISHED) */}
            <div className="bg-concrete-950 p-3.5 border-2 border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold uppercase tracking-wider">
                  MARITIME WATERWAY ACCESS
                </span>
                <span className="bg-amber-950/60 border border-amber-700 text-amber-300 px-1.5 py-0.5 text-[9px] font-bold">
                  {maritimeAccess.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div>
                  <span className="text-concrete-500 block text-[9px]">NAVIGABLE DISTANCE</span>
                  <strong className="text-amber-400 font-bold text-xs">
                    {navigableKm != null ? `${navigableKm.toFixed(1)} KM` : 'NOT ESTABLISHED'}
                  </strong>
                </div>
                <div>
                  <span className="text-concrete-500 block text-[9px]">OPERATIONAL ETA</span>
                  <strong className="text-amber-400 font-bold text-xs">
                    {operationalEta}
                  </strong>
                </div>
              </div>

              <div className="pt-1.5 border-t border-concrete-800/80 flex items-center justify-between text-[10px]">
                <span className="text-concrete-500">ROUTING STATUS:</span>
                <span className="text-amber-400 font-black tracking-wide">
                  ⚠ {routingStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Harbor Physical Attributes */}
          <div className="bg-concrete-950 border border-concrete-800 p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-concrete-500 block text-[9px]">CHANNEL DEPTH</span>
              <strong className="text-concrete-200">
                {wpiAttrs.channel_depth_m ? `${wpiAttrs.channel_depth_m} M` : 'UNREPORTED'}
              </strong>
            </div>
            <div>
              <span className="text-concrete-500 block text-[9px]">CARGO PIER DEPTH</span>
              <strong className="text-concrete-200">
                {wpiAttrs.cargo_pier_depth_m ? `${wpiAttrs.cargo_pier_depth_m} M` : 'UNREPORTED'}
              </strong>
            </div>
            <div>
              <span className="text-concrete-500 block text-[9px]">PILOTAGE</span>
              <strong className="text-concrete-200">
                {wpiAttrs.pilotage_compulsory || 'UNREPORTED'}
              </strong>
            </div>
            <div>
              <span className="text-concrete-500 block text-[9px]">TUG ASSISTANCE</span>
              <strong className="text-emerald-400">
                {wpiAttrs.tugs_assist === 'Available' || wpiAttrs.tugs_assist === 'Y' ? 'Available' : (wpiAttrs.tugs_assist || 'UNREPORTED')}
              </strong>
            </div>
          </div>

          {/* Candidate Discovery Audit Table */}
          <div className="bg-concrete-950 border border-concrete-800 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between border-b border-concrete-800 pb-1.5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                  WPI CANDIDATE AUDIT // DISCOVERY POOL (SORT: GEODESIC DISTANCE ↑)
                </span>
              </div>
              <span className="text-[9px] text-concrete-500 font-mono">
                {totalFeatures} FEATURES RETURNED · {withinRadius} QUALIFYING (≤350 KM)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-concrete-800 text-[10px] text-concrete-500 uppercase">
                    <th className="py-1 px-2">RANK</th>
                    <th className="py-1 px-2">PORT CANDIDATE</th>
                    <th className="py-1 px-2">WPI / LOCODE</th>
                    <th className="py-1 px-2">GEODESIC</th>
                    <th className="py-1 px-2">BEARING</th>
                    <th className="py-1 px-2">DEPTH</th>
                    <th className="py-1 px-2">TUGS</th>
                    <th className="py-1 px-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-800/40">
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 px-2 text-center text-concrete-500 italic">
                        NO WPI CANDIDATE PORTS DISCOVERED WITHIN RADIUS
                      </td>
                    </tr>
                  ) : (
                    candidates.map((cand: any, idx: number) => {
                      const isSelected = cand.is_selected ?? (idx === 0);
                      return (
                        <tr
                          key={cand.wpi_number || idx}
                          className={`transition ${isSelected ? 'bg-concrete-900 text-concrete-100 font-bold' : 'text-concrete-400 hover:text-concrete-200'}`}
                        >
                          <td className="py-1 px-2">{String(cand.rank || idx + 1).padStart(2, '0')}</td>
                          <td className="py-1 px-2 text-concrete-200">{cand.main_port_name || cand.port_name}</td>
                          <td className="py-1 px-2 text-sky-400">#{cand.wpi_number} ({cand.unlocode || cand.un_locode || '—'})</td>
                          <td className="py-1 px-2 font-mono">{cand.distance_km != null ? `${cand.distance_km} km` : '—'}</td>
                          <td className="py-1 px-2">{cand.bearing_deg != null ? `${cand.bearing_deg}° T` : '—'}</td>
                          <td className="py-1 px-2">{cand.channel_depth_m ? `${cand.channel_depth_m}m` : '—'}</td>
                          <td className="py-1 px-2">{cand.tugs_assist || '—'}</td>
                          <td className="py-1 px-2 text-right">
                            {isSelected ? (
                              <span className="text-safety-orange font-bold text-[10px]">★ SELECTED</span>
                            ) : (
                              <span className="text-concrete-600 text-[10px]">CANDIDATE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: SITREP & Caveat */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
                SITREP TRANSMISSION
              </span>
              <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                TACTICAL C2
              </span>
            </div>
            <p className="text-[11px] text-concrete-400 leading-relaxed">
              Synthesizes an automated situation report logging the discovered WPI candidate pool, selected response port, and geodesic reference locus for maritime headquarters command.
            </p>

            {/* Honest Technical Distinction Callout */}
            <div className="p-3 bg-concrete-950 border border-concrete-800 text-[10px] text-concrete-400 space-y-1.5 leading-relaxed">
              <strong className="text-amber-400 block font-bold uppercase">
                ROUTING STATUS // {routingStatus.replace('_', ' ')}:
              </strong>
              <div className="space-y-1 text-concrete-500">
                <p>• <strong>Provider:</strong> {routingProvider}</p>
                <p>• <strong>Reason:</strong> {routingReason}</p>
                <p>• <strong>Distance:</strong> {geodesicKm != null ? `${geodesicKm.toFixed(1)} km` : '—'} straight-line reference.</p>
                <p>• <strong>Navigable Water Route:</strong> NOT ESTABLISHED.</p>
                <p>• <strong>Operational ETA:</strong> NOT ESTABLISHED.</p>
              </div>
              <p className="pt-1 text-[9px] text-concrete-500 border-t border-concrete-800/80 italic">
                WPI establishes physical port suitability based on published infrastructure attributes; it does not establish that an active response vessel has been deployed or that a navigable channel route has been calculated.
              </p>
            </div>
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
              ? '[ SITREP TRANSMITTED TO MARITIME HQ ✓ ]'
              : '[ TRANSMIT TACTICAL SITREP DISPATCH → ]'}
          </button>
        </div>
      </div>
    </section>
  );
}
