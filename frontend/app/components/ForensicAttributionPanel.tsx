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

  const [showTechnical, setShowTechnical] = React.useState(false);

  const cpaDist = suspect.cpa_dist_km ?? suspect.distance_km;
  const aisGap = suspect.ais_gap_hours !== undefined ? suspect.ais_gap_hours : 0.0;
  const courseChange = suspect.max_course_change_deg;
  const minSpeed = suspect.min_speed_knots ?? suspect.speed_knots;
  const isReal = suspect.is_historical_real ?? true;

  // Level 1 Evidence Display
  const evidenceSummary = suspect.evidence_summary;
  const cpaDisplay = evidenceSummary?.cpa_display || (cpaDist != null ? `${Number(cpaDist).toFixed(2)} KM` : '—');
  const temporalContext = evidenceSummary?.temporal_context || 'WINDOW OVERLAP VERIFIED';
  const cpaTime = evidenceSummary?.cpa_time_utc || suspect.cpa_time_utc || 'RECORDED IN WINDOW';
  const trajectoryDisplay = evidenceSummary?.trajectory_display || (
    traj === 0 ? 'NO POSITIVE CONTRIBUTION' :
    courseChange ? `${Number(courseChange).toFixed(0)}° COURSE DEVIATION` :
    `${traj.toFixed(3)} CONTRIBUTION`
  );
  const behaviorDisplay = evidenceSummary?.behavior_display || (
    suspect.anomaly_flags && suspect.anomaly_flags.length > 0
      ? suspect.anomaly_flags.join(' · ')
      : (courseChange ? `${Number(courseChange).toFixed(0)}° COURSE DEVIATION` : 'STANDARD TRANSIT BASELINE')
  );

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
              {isPrimary ? 'PRIMARY ATTRIBUTION CANDIDATE' : 'ATTRIBUTION CANDIDATE'}
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
            AEGISSEA ATTRIBUTION INDEX
          </span>
          <div className="text-2xl sm:text-3xl font-black text-safety-orange font-display">
            {Number(priorityScore).toFixed(1)}{' '}
            <span className="text-xs text-concrete-500 font-mono">/ 100</span>
          </div>
          <span className="text-[9px] text-concrete-400 block italic mt-0.5">
            Engineering prioritization index
          </span>
        </div>
      </div>

      {/* Level 1: Human-Readable "WHY THIS VESSEL WAS FLAGGED" */}
      <div className="bg-concrete-900 border-2 border-safety-orange/80 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
          <span className="font-extrabold text-xs uppercase tracking-wider text-safety-orange">
            WHY THIS VESSEL WAS FLAGGED
          </span>
          <span className="text-[10px] text-concrete-400 font-mono">
            FORENSIC EVIDENCE SUMMARY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* CPA Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 flex items-center justify-between">
            <div>
              <span className="text-concrete-500 block text-[10px] uppercase">CLOSEST POINT OF APPROACH (CPA)</span>
              <strong className="text-safety-orange font-mono font-bold text-sm">{cpaDisplay}</strong>
            </div>
            <span className="text-[10px] text-concrete-400">TO RELEASE LOCUS</span>
          </div>

          {/* Temporal Context Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 flex items-center justify-between">
            <div>
              <span className="text-concrete-500 block text-[10px] uppercase">TEMPORAL CONTEXT</span>
              <strong className="text-cyan-400 font-bold text-xs">{temporalContext}</strong>
            </div>
            <span className="text-[10px] text-concrete-400 font-mono">{cpaTime}</span>
          </div>

          {/* Trajectory Alignment Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 flex items-center justify-between">
            <div>
              <span className="text-concrete-500 block text-[10px] uppercase">TRAJECTORY ALIGNMENT</span>
              <strong className="text-concrete-100 font-bold text-xs">{trajectoryDisplay}</strong>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">+{(traj * 30).toFixed(1)} pts</span>
          </div>

          {/* Behavioral Anomaly Card */}
          <div className="bg-concrete-950 p-3 border border-concrete-800 flex items-center justify-between">
            <div>
              <span className="text-concrete-500 block text-[10px] uppercase">BEHAVIORAL ANOMALY</span>
              <strong className="text-safety-orange font-bold text-xs">{behaviorDisplay}</strong>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">+{(anom * 25).toFixed(1)} pts</span>
          </div>
        </div>

        {/* Level 2 Technical Evidence Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full bg-concrete-950 hover:bg-concrete-800 text-concrete-200 border border-concrete-700 hover:border-safety-orange py-2 px-3 text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center space-x-2 text-cyan-400">
              <span>{showTechnical ? '▼' : '▶'}</span>
              <span>[ ≡ {showTechnical ? 'HIDE' : 'VIEW'} TECHNICAL EVIDENCE & AUDIT FORMULA ]</span>
            </span>
            <span className="text-[10px] text-concrete-400 font-normal">HEURISTIC 45/30/25 EQUATIONS</span>
          </button>

          {/* Level 2 Expandable Technical Details */}
          {showTechnical && (
            <div className="mt-3 space-y-3 bg-concrete-950 p-3.5 border border-concrete-700">
              {/* Engineering Formula */}
              <div className="space-y-1">
                <span className="text-[10px] text-concrete-400 font-bold uppercase block">
                  ANALYTICAL ATTRIBUTION WEIGHTING EQUATION
                </span>
                <div className="text-[11px] font-mono text-concrete-200 bg-concrete-900 p-2 border border-concrete-800">
                  Formula: <span className="text-safety-orange font-bold">0.45 · Proximity</span> + <span className="text-sky-400 font-bold">0.30 · Trajectory</span> + <span className="text-amber-400 font-bold">0.25 · Behavior</span>
                </div>
              </div>

              {/* Detailed Factor Breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Proximity */}
                <div className="bg-concrete-900 p-2.5 border border-concrete-800 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-concrete-400 font-bold">PROXIMITY FACTOR</span>
                    <span className="text-safety-orange font-mono font-black">{prox.toFixed(3)}</span>
                  </div>
                  <div className="text-[9px] text-safety-orange font-mono">
                    {renderBlocks(prox * 100, 14)}
                  </div>
                  <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
                    Contribution: <strong className="text-concrete-100">+{(prox * 45).toFixed(1)} pts</strong>
                  </div>
                  <span className="text-[9px] text-concrete-500 block">
                    Gaussian decay: σ = 6.0 km, d = {cpaDist != null ? Number(cpaDist).toFixed(2) : '—'} km
                  </span>
                </div>

                {/* Trajectory */}
                <div className="bg-concrete-900 p-2.5 border border-concrete-800 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-400 font-bold">TRAJECTORY FACTOR</span>
                    <span className="text-amber-400 font-mono font-black">{traj.toFixed(3)}</span>
                  </div>
                  <div className="text-[9px] text-amber-500 font-mono">
                    {renderBlocks(traj * 100, 14)}
                  </div>
                  <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
                    Contribution: <strong className="text-amber-400 font-mono">+{(traj * 30).toFixed(1)} pts</strong>
                  </div>
                  <span className="text-[9px] text-concrete-500 block">
                    Cosine alignment: max(0, cos(Δθ))
                  </span>
                </div>

                {/* Behavioral */}
                <div className="bg-concrete-900 p-2.5 border border-concrete-800 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">BEHAVIOR FACTOR</span>
                    <span className="text-emerald-400 font-mono font-black">{anom.toFixed(3)}</span>
                  </div>
                  <div className="text-[9px] text-emerald-500 font-mono">
                    {renderBlocks(anom * 100, 14)}
                  </div>
                  <div className="text-[10px] text-concrete-300 pt-1 border-t border-concrete-800">
                    Contribution: <strong className="text-concrete-100">+{(anom * 25).toFixed(1)} pts</strong>
                  </div>
                  <span className="text-[9px] text-concrete-500 block">
                    Deflection: {courseChange != null ? `${courseChange.toFixed(0)}°` : '0°'}
                  </span>
                </div>
              </div>

              {/* Kinematic Raw Signals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-concrete-800">
                <div className="p-1.5 text-[10px]">
                  <span className="text-concrete-500 block">AIS BROADCAST GAP</span>
                  <strong className="text-concrete-200">
                    {aisGap > 0 ? `${aisGap.toFixed(1)}h Gap` : '0.0h (Continuous)'}
                  </strong>
                </div>
                <div className="p-1.5 text-[10px]">
                  <span className="text-concrete-500 block">COURSE DEFLECTION</span>
                  <strong className="text-safety-orange font-bold">
                    {courseChange != null ? `${courseChange.toFixed(1)}° Heading Deflection` : '0.0°'}
                  </strong>
                </div>
                <div className="p-1.5 text-[10px]">
                  <span className="text-concrete-500 block">MINIMUM SPEED</span>
                  <strong className="text-concrete-200">
                    {minSpeed != null ? `${Number(minSpeed).toFixed(1)} knots` : '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forensic Disclaimers */}
      <div className="bg-concrete-900 border border-concrete-700 p-3 text-[10px] text-concrete-400 space-y-1">
        <strong className="text-safety-orange uppercase tracking-wider block font-bold">
          [!] FORENSIC & INVESTIGATIVE EVIDENCE PRESENTATION
        </strong>
        <p className="leading-relaxed">
          The AegisSea attribution score is an automated engineering prioritization index to direct maritime Coast Guard inspection; it is not a legal probability of liability. Notice that {vName} has a Trajectory Factor of {traj.toFixed(3)} — its ranking derives from proximity and operational corridor characteristics, not confirmed course convergence.
        </p>
      </div>

      {/* Action Trigger */}
      <button
        onClick={onOpenDossier}
        className="brutalist-btn-orange w-full py-2.5 text-xs font-mono font-bold tracking-wider uppercase text-center flex items-center justify-center space-x-2 cursor-pointer"
      >
        <span>[ COMPILE COMPLETE INCIDENT EVIDENCE & AUDIT DOSSIER → ]</span>
      </button>
    </div>
  );
}
