'use client';

import React from 'react';

interface ForensicAttributionPanelProps {
  suspect?: any;
  onOpenDossier?: () => void;
  isPrimary?: boolean;
}

export default function ForensicAttributionPanel({
  suspect,
  onOpenDossier,
  isPrimary = true,
}: ForensicAttributionPanelProps) {
  if (!suspect) {
    return (
      <div className="bg-concrete-950 border-2 border-concrete-700 p-6 font-mono text-center text-concrete-500">
        <span className="text-xs uppercase tracking-wider block font-bold text-concrete-400">
          FORENSIC ATTRIBUTION STANDBY
        </span>
        <p className="text-xs mt-1">Select an attribution candidate from the ranking matrix to view telemetry breakdown.</p>
      </div>
    );
  }

  const vName = suspect.vessel_name || suspect.vessel_id || 'ATTRIBUTION CANDIDATE';
  const priorityScore = suspect.attribution_score_pct ?? (suspect.confidence_score !== undefined ? suspect.confidence_score : 0.0);

  // Derive component factors from attribution_breakdown if present, else direct props
  const breakdown = suspect.attribution_breakdown;
  const prox = breakdown?.proximity?.normalized_factor ?? (suspect.proximity_score !== undefined ? suspect.proximity_score : 0.0);
  const traj = breakdown?.trajectory_correlation?.normalized_factor ?? (suspect.trajectory_score !== undefined ? suspect.trajectory_score : 0.0);
  const anom = breakdown?.behavioral_anomaly?.normalized_factor ?? (suspect.behavioral_anomaly_score !== undefined ? suspect.behavioral_anomaly_score : 0.0);

  const cpaDist = suspect.cpa_dist_km ?? suspect.distance_km;
  const aisGap = suspect.ais_gap_hours !== undefined ? suspect.ais_gap_hours : 0.0;
  const courseChange = suspect.max_course_change_deg;
  const minSpeed = suspect.min_speed_knots ?? suspect.speed_knots;
  const isReal = suspect.is_historical_real ?? true;

  const renderBlocks = (pct: number, totalBlocks = 20) => {
    const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * totalBlocks);
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
              {isPrimary ? 'POTENTIAL SOURCE VESSEL' : 'ATTRIBUTION CANDIDATE'}
            </span>
            <span className="stamp-tag border-cyan-500 text-cyan-400 bg-cyan-950/40 text-[9px]">
              {isReal ? 'REAL HISTORICAL AIS (NOAA MARINECADASTRE)' : (suspect.ais_status || 'AIS CANDIDATE')}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-concrete-100 font-display uppercase mt-1">
            {vName} // MMSI: {suspect.mmsi || 'NO MMSI'}
          </h3>
        </div>

        <div className="text-right border-l-2 border-concrete-800 pl-4">
          <span className="text-[10px] text-concrete-500 font-bold uppercase block">
            AEGISSEA SCORE
          </span>
          <div className="text-2xl sm:text-3xl font-black text-safety-orange font-display">
            {Number(priorityScore).toFixed(1)}{' '}
            <span className="text-xs text-concrete-500 font-mono">/ 100</span>
          </div>
          <span className="stamp-tag border-safety-orange text-safety-orange text-[8px] font-bold">
            INTERROGATION LEAD
          </span>
        </div>
      </div>

      {/* Metadata Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-concrete-900 p-3 border border-concrete-800 text-xs">
        <div>
          <span className="text-concrete-500 block text-[10px]">FLAG STATE</span>
          <strong className="text-concrete-200">{suspect.flag || 'UNKNOWN'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">VESSEL TYPE</span>
          <strong className="text-concrete-200">{suspect.vessel_type || 'UNSPECIFIED'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">MMSI / REGISTRY</span>
          <strong className="text-concrete-200">{suspect.mmsi || 'NO MMSI'}</strong>
        </div>
        <div>
          <span className="text-concrete-500 block text-[10px]">CPA TO ORIGIN</span>
          <strong className="text-safety-orange font-bold font-mono">
            {cpaDist != null ? `${Number(cpaDist).toFixed(2)} KM` : '—'}
          </strong>
        </div>
      </div>

      {/* Engineering Scoring Formula Summary */}
      <div className="bg-concrete-900 border border-concrete-800 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-[10px] text-concrete-400 font-bold uppercase">
            AEGISSEA ATTRIBUTION SCORE // ENGINEERING METHODOLOGY
          </div>
          <div className="text-[11px] font-mono text-concrete-200">
            Formula: <span className="text-safety-orange font-bold">0.45·Proximity</span> + <span className="text-sky-400 font-bold">0.30·Trajectory</span> + <span className="text-amber-400 font-bold">0.25·Behavior</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <span className="bg-concrete-950 border border-concrete-700 px-2 py-1 text-concrete-300">PROXIMITY 45%</span>
          <span className="bg-concrete-950 border border-concrete-700 px-2 py-1 text-concrete-300">TRAJECTORY 30%</span>
          <span className="bg-concrete-950 border border-concrete-700 px-2 py-1 text-concrete-300">BEHAVIOR 25%</span>
        </div>
      </div>

      {/* "WHY THIS CANDIDATE?" Detailed Forensic Callout */}
      <div className="bg-concrete-900 border-2 border-concrete-700 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
          <span className="font-extrabold text-xs uppercase tracking-wider text-concrete-100">
            WHY THIS CANDIDATE? // FACTOR CONTRIBUTION BREAKDOWN
          </span>
          <span className="text-[10px] text-concrete-500 font-mono">
            ENGINEERING ATTRIBUTION INDEX
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Proximity Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-concrete-400 font-bold">PROXIMITY FACTOR</span>
              <span className="text-safety-orange font-mono font-black">{prox.toFixed(3)}</span>
            </div>
            <div className="text-[10px] text-safety-orange font-mono">
              {renderBlocks(prox * 100, 16)}
            </div>
            <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
              Contribution: <strong className="text-concrete-100">+{(prox * 45).toFixed(1)} pts</strong>
            </div>
            <p className="text-[9px] text-concrete-500">
              {cpaDist != null
                ? `CPA of ${Number(cpaDist).toFixed(2)} km to reconstructed release locus (T - 6.5h).`
                : 'Proximity calculated from historical track extrapolation.'}
            </p>
          </div>

          {/* Trajectory Alignment Card - Transparent Zero Callout */}
          <div className="bg-concrete-950 p-3 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-amber-400 font-bold">TRAJECTORY FACTOR</span>
              <span className="text-amber-400 font-mono font-black">{traj.toFixed(3)}</span>
            </div>
            <div className="text-[10px] text-amber-500 font-mono">
              {renderBlocks(traj * 100, 16)}
            </div>
            <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
              Contribution: <strong className="text-amber-400 font-mono">+{(traj * 30).toFixed(1)} pts</strong>
            </div>
            <p className="text-[9px] text-amber-300/80 leading-tight">
              {traj === 0
                ? '⚠ Zero directional correlation with CMEMS drift vector. Score reflects proximity, not course convergence.'
                : 'Co-directional correlation with CMEMS ocean drift vector.'}
            </p>
          </div>

          {/* Behavioral Anomaly Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-concrete-400 font-bold">BEHAVIOR FACTOR</span>
              <span className="text-emerald-400 font-mono font-black">{anom.toFixed(3)}</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-mono">
              {renderBlocks(anom * 100, 16)}
            </div>
            <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
              Contribution: <strong className="text-concrete-100">+{(anom * 25).toFixed(1)} pts</strong>
            </div>
            <p className="text-[9px] text-concrete-500">
              {courseChange != null
                ? `Sudden ${courseChange.toFixed(1)}° course deflection maneuver observed in corridor.`
                : 'Baseline kinematic compliance within commercial shipping lane.'}
            </p>
          </div>
        </div>

        {/* 3 Trajectory Kinematic Signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div className="bg-concrete-950 border border-concrete-800 p-2 text-[10px]">
            <span className="text-concrete-500 block">AIS MAX BLACKOUT GAP</span>
            <strong className="text-concrete-200">
              {aisGap > 0 ? `${aisGap.toFixed(1)}h Gap` : '0.0h (Continuous Broadcast)'}
            </strong>
          </div>
          <div className="bg-concrete-950 border border-concrete-800 p-2 text-[10px]">
            <span className="text-concrete-500 block">COURSE DEVIATION</span>
            <strong className="text-safety-orange font-bold">
              {courseChange != null ? `${courseChange.toFixed(1)}° Heading Deflection` : '0.0° Course Deviation'}
            </strong>
          </div>
          <div className="bg-concrete-950 border border-concrete-800 p-2 text-[10px]">
            <span className="text-concrete-500 block">MINIMUM OBSERVED SPEED</span>
            <strong className="text-concrete-200">
              {minSpeed != null ? `${Number(minSpeed).toFixed(1)} knots (Transit)` : '— knots'}
            </strong>
          </div>
        </div>
      </div>

      {/* Presumption of Innocence Disclaimer */}
      <div className="bg-concrete-900 border border-concrete-700 p-3 text-[10px] text-concrete-400 space-y-1">
        <strong className="text-safety-orange uppercase tracking-wider block font-bold">
          [!] EVIDENTIARY PRINCIPLE // PRESUMPTION OF INNOCENCE
        </strong>
        <p className="leading-relaxed">
          The AegisSea attribution score is an automated engineering prioritization index to direct maritime Coast Guard inspection; it is not a legal probability of liability. Notice that {vName} has a Trajectory Factor of {traj.toFixed(3)} — its status as an Interrogation Lead derives from proximity and operational corridor characteristics, not confirmed course convergence.
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
