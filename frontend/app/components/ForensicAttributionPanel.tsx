'use client';

import React from 'react';

interface ForensicAttributionPanelProps {
  suspect: any;
  onOpenDossier?: () => void;
}

export default function ForensicAttributionPanel({
  suspect,
  onOpenDossier,
}: ForensicAttributionPanelProps) {
  if (!suspect) {
    return (
      <div className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono text-concrete-400 text-xs">
        [ SELECT A CANDIDATE VESSEL FROM THE TABLE OR MAP TO AUDIT FORENSIC ATTRIBUTION ]
      </div>
    );
  }

  const vName = suspect.vessel_name || suspect.name || suspect.dark_target_id;
  const isPrimary = (suspect.attribution_score_pct || 85) >= 80;
  const priorityScore = suspect.attribution_score_pct || suspect.risk_index_pct || 93.1;
  const prox = suspect.proximity_score !== undefined ? suspect.proximity_score : 0.94;
  const traj = suspect.trajectory_score !== undefined ? suspect.trajectory_score : 0.999;
  const anom = suspect.behavioral_anomaly_score !== undefined ? suspect.behavioral_anomaly_score : 0.833;

  const aisGap = suspect.ais_gap_hours !== undefined ? suspect.ais_gap_hours : 2.4;
  const draftDelta = suspect.draft_change_m !== undefined ? suspect.draft_change_m : 0.8;
  const minSpeed = suspect.min_speed_knots !== undefined ? suspect.min_speed_knots : 3.8;

  // Render brutalist block progress bar
  const renderBlocks = (pct: number, totalBlocks = 20) => {
    const filled = Math.round((pct / 100) * totalBlocks);
    const empty = totalBlocks - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Panel Title & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-safety-orange text-concrete-950 px-2 py-0.5 text-xs font-black uppercase tracking-wider">
              {isPrimary ? 'PRIMARY INVESTIGATIVE LEAD' : 'CANDIDATE AUDIT'}
            </span>
            <span className="stamp-tag border-concrete-600 text-concrete-400 text-[9px]">
              SYNTHETIC DEMONSTRATION
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-concrete-100 font-display uppercase mt-1">
            {vName} // {suspect.vessel_id || suspect.dark_target_id}
          </h3>
        </div>

        <div className="text-right border-l-2 border-concrete-800 pl-4">
          <span className="text-[10px] text-concrete-500 font-bold uppercase block">
            INVESTIGATIVE PRIORITY
          </span>
          <div className="text-2xl sm:text-3xl font-black text-safety-orange font-display">
            {priorityScore.toFixed(1)}{' '}
            <span className="text-xs text-concrete-500 font-mono">/ 100</span>
          </div>
          <span className="stamp-tag border-safety-orange text-safety-orange text-[8px]">
            HEURISTIC INDEX
          </span>
        </div>
      </div>

      {/* Metadata Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-concrete-900 p-3 border border-concrete-800 text-xs">
        <div>
          <span className="text-concrete-500 block text-[10px]">FLAG STATE</span>
          <strong className="text-concrete-200">{suspect.flag || 'PANAMA (SYN)'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">VESSEL TYPE</span>
          <strong className="text-concrete-200">{suspect.vessel_type || 'Crude Oil Tanker'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">MMSI / REGISTRY</span>
          <strong className="text-concrete-200">{suspect.mmsi || 'SYN-AIS-9482'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">CPA TO ORIGIN</span>
          <strong className="text-safety-orange font-bold font-mono">
            {suspect.distance_km || suspect.cpa_dist_km || 1.8} KM
          </strong>
        </div>
      </div>

      {/* 3-Term Formula Breakdown Block */}
      <div className="bg-concrete-900 border-2 border-concrete-700 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
          <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
            PS 26143 3-TERM WEIGHTED ATTRIBUTION BREAKDOWN
          </span>
          <span className="text-[10px] text-concrete-500 font-mono">
            S = 0.45·S_prox + 0.30·S_traj + 0.25·S_anom
          </span>
        </div>

        {/* Term 1: Proximity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-concrete-300 font-bold">
              01 // SPATIO-TEMPORAL PROXIMITY (45% WEIGHT)
            </span>
            <span className="text-safety-orange font-mono font-bold">
              {(prox * 100).toFixed(1)}% (FACTOR: {prox.toFixed(3)})
            </span>
          </div>
          <div className="text-[11px] font-mono text-safety-orange tracking-widest bg-concrete-950 p-1.5 border border-concrete-800">
            {renderBlocks(prox * 100, 24)}
          </div>
          <div className="text-[10px] text-concrete-500 flex justify-between">
            <span>Gaussian Spatial Decay (σ = 5.0 km)</span>
            <span>Distance to Reconstructed Origin: {suspect.distance_km || 1.8} km</span>
          </div>
        </div>

        {/* Term 2: Trajectory Alignment */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-concrete-300 font-bold">
              02 // TRAJECTORY ALIGNMENT (30% WEIGHT)
            </span>
            <span className="text-safety-orange font-mono font-bold">
              {(traj * 100).toFixed(1)}% (FACTOR: {traj.toFixed(3)})
            </span>
          </div>
          <div className="text-[11px] font-mono text-safety-orange tracking-widest bg-concrete-950 p-1.5 border border-concrete-800">
            {renderBlocks(traj * 100, 24)}
          </div>
          <div className="text-[10px] text-concrete-500 flex justify-between">
            <span>Directional Cosine Similarity with Drift Corridor</span>
            <span>Vessel Heading: {suspect.heading_deg || 126.5}° T</span>
          </div>
        </div>

        {/* Term 3: Behavioral Anomaly */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-concrete-300 font-bold">
              03 // BEHAVIORAL ANOMALY TELEMETRY (25% WEIGHT)
            </span>
            <span className="text-safety-orange font-mono font-bold">
              {(anom * 100).toFixed(1)}% (FACTOR: {anom.toFixed(3)})
            </span>
          </div>
          <div className="text-[11px] font-mono text-safety-orange tracking-widest bg-concrete-950 p-1.5 border border-concrete-800">
            {renderBlocks(anom * 100, 24)}
          </div>
          <div className="text-[10px] text-concrete-500 flex justify-between">
            <span>Heuristic composite of transponder gaps, speed reductions & draft changes</span>
            <span>Triggered Flags: 3 / 3</span>
          </div>
        </div>
      </div>

      {/* Forensic Anomaly Flags Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-concrete-900 border border-concrete-800 p-2.5">
          <div className="flex items-center justify-between text-[10px] text-concrete-500 mb-1">
            <span>FLAG 01 // AIS GAP</span>
            <span className="stamp-tag border-safety-orange text-safety-orange text-[8px]">ANOMALY</span>
          </div>
          <div className="font-bold text-concrete-100">{aisGap} HOURS BLACKOUT</div>
          <p className="text-[10px] text-concrete-500 mt-1">Transponder offline near origin locus</p>
        </div>

        <div className="bg-concrete-900 border border-concrete-800 p-2.5">
          <div className="flex items-center justify-between text-[10px] text-concrete-500 mb-1">
            <span>FLAG 02 // SPEED DROP</span>
            <span className="stamp-tag border-safety-orange text-safety-orange text-[8px]">ANOMALY</span>
          </div>
          <div className="font-bold text-concrete-100">{minSpeed} KNOTS MIN SPEED</div>
          <p className="text-[10px] text-concrete-500 mt-1">Deceleration to deballasting speed</p>
        </div>

        <div className="bg-concrete-900 border border-concrete-800 p-2.5">
          <div className="flex items-center justify-between text-[10px] text-concrete-500 mb-1">
            <span>FLAG 03 // DRAFT DELTA</span>
            <span className="stamp-tag border-safety-orange text-safety-orange text-[8px]">ANOMALY</span>
          </div>
          <div className="font-bold text-concrete-100">ΔDRAFT: +{draftDelta} METERS</div>
          <p className="text-[10px] text-concrete-500 mt-1">Potential liquid cargo/sludge discharge</p>
        </div>
      </div>

      {/* Crucial Presumption of Innocence Caveat Box */}
      <div className="bg-concrete-900 border border-concrete-700 p-3 text-[11px] text-concrete-400 space-y-1">
        <strong className="text-safety-orange uppercase tracking-wider block font-bold">
          [!] EVIDENTIARY PRINCIPLE // PRESUMPTION OF INNOCENCE
        </strong>
        <p className="leading-relaxed">
          The 93.1 priority index represents an automated heuristic investigative ranking designed to focus limited maritime inspection assets. It does not establish legal liability or criminal guilt under maritime law (UNCLOS / MARPOL).
        </p>
      </div>

      {/* Action Trigger */}
      <button
        onClick={onOpenDossier}
        className="brutalist-btn-orange w-full py-2.5 text-xs font-mono font-bold tracking-wider uppercase text-center flex items-center justify-center space-x-2"
      >
        <span>[ COMPILE COMPLETE INCIDENT EVIDENCE & AUDIT DOSSIER → ]</span>
      </button>
    </div>
  );
}
