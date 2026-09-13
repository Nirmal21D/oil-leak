'use client';

import React, { useState } from 'react';
import { Anchor, FileText, Send, Clock, Sliders } from 'lucide-react';
import DossierModal from './DossierModal';

interface TacticalSidebarProps {
  scenarioData?: any;
  detectionResult?: any;
  primarySuspect?: any;
  timelineHour?: number;
  onTimelineChange?: (hour: number) => void;
}

export default function TacticalSidebar({
  scenarioData,
  detectionResult,
  primarySuspect,
  timelineHour = 0,
  onTimelineChange
}: TacticalSidebarProps) {
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [spectralTab, setSpectralTab] = useState<'raw' | 'prob' | 'binary'>('prob');
  const [sitrepSent, setSitrepSent] = useState<boolean>(false);

  const suspect = primarySuspect || (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);
  const responder = scenarioData?.responder_route;

  const handleTransmitSitrep = () => {
    setSitrepSent(true);
    setTimeout(() => setSitrepSent(false), 3000);
  };

  return (
    <>
      <div className="space-y-4 font-mono select-none">
        {/* 01 / SUSPECT VESSEL INTERCEPT CARD */}
        <div className="bg-[#111622] border border-[#232d45] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1c2438] pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-100 uppercase tracking-wider">
              <Anchor className="w-4 h-4 text-sky-400" />
              <span>01 / PRIMARY INVESTIGATIVE LEAD</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
              {suspect ? `PRIORITY: ${suspect.attribution_score_pct || suspect.risk_index_pct || 88} (HEURISTIC)` : 'CANDIDATE'}
            </span>
          </div>

          {suspect ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-slate-100 text-sm">{suspect.vessel_name || suspect.dark_target_id}</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161d2d] text-slate-400 border border-[#232d45]">
                      SYNTHETIC DEMO
                    </span>
                  </div>
                  <div className="text-[10px] text-sky-400 font-normal">{suspect.vessel_id || suspect.dark_target_id} • Flag: {suspect.flag || 'PANAMA'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">TYPE</div>
                  <div className="font-semibold text-slate-300">{suspect.vessel_type || 'SAR Target'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#161d2d] p-3 rounded-lg border border-[#232d45]">
                <div>
                  <span className="text-slate-500">MMSI:</span> <strong className="text-slate-300">{suspect.mmsi || 'SYN-41901'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">SPEED/HDG:</span> <strong className="text-slate-200">{suspect.speed_knots || '12.4'} kn / {suspect.heading_deg || '126.5'}°</strong>
                </div>
                <div>
                  <span className="text-slate-500">CLOSEST APP:</span> <strong className="text-amber-400">{suspect.distance_km || suspect.cpa_dist_km || 1.8} km</strong>
                </div>
                <div>
                  <span className="text-slate-500">INTERCEPT:</span> <strong className="text-emerald-400">{responder?.eta_formatted || 'T+4.0h'}</strong>
                </div>
              </div>

              {/* 3-Term Formula Score Breakdown (PS 26143 Specification) */}
              {suspect.proximity_score !== undefined && (
                <div className="bg-[#161d2d] p-2.5 rounded-lg border border-[#232d45] space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between text-slate-400 font-bold border-b border-[#232d45] pb-1">
                    <span>3-TERM ATTRIBUTION CRITERIA</span>
                    <span className="text-sky-400 font-mono text-[9px]">HEURISTIC: 45/30/25</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                    <div className="bg-[#0b0e14] p-1 rounded border border-[#1c2438]">
                      <div className="text-slate-500 text-[9px]">S_prox (45%)</div>
                      <div className="text-sky-300 font-bold">{(suspect.proximity_score * 100).toFixed(0)}</div>
                    </div>
                    <div className="bg-[#0b0e14] p-1 rounded border border-[#1c2438]">
                      <div className="text-slate-500 text-[9px]">S_traj (30%)</div>
                      <div className="text-sky-300 font-bold">{(suspect.trajectory_score * 100).toFixed(0)}</div>
                    </div>
                    <div className="bg-[#0b0e14] p-1 rounded border border-[#1c2438]">
                      <div className="text-slate-500 text-[9px]">S_anom (25%)</div>
                      <div className="text-amber-400 font-bold">{(suspect.behavioral_anomaly_score * 100).toFixed(0)}</div>
                    </div>
                  </div>
                  {(suspect.ais_gap_hours !== undefined || suspect.draft_change_m !== undefined) && (
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-[#1c2438] font-mono">
                      <span>AIS Gap: <strong className={suspect.ais_gap_hours > 0 ? "text-amber-400" : "text-slate-300"}>{suspect.ais_gap_hours || 0}h</strong></span>
                      <span>ΔDraft: <strong className={suspect.draft_change_m > 0 ? "text-amber-400" : "text-slate-300"}>{suspect.draft_change_m || 0}m</strong></span>
                      <span>Min SOG: <strong className={suspect.min_speed_knots < 5 ? "text-amber-400" : "text-slate-300"}>{suspect.min_speed_knots || suspect.speed_knots} kn</strong></span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed bg-[#0b0e14] p-2 rounded border border-[#1c2438]">
                <strong>Investigative Ranking Note:</strong> Heuristic priority index based on spatio-temporal alignment and telemetry anomalies. Does not establish legal proof of discharge.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Loading suspect telemetry...</div>
          )}
        </div>

        {/* 02 / SAR SPECTRAL DECOMPOSITION VIEWER */}
        <div className="bg-[#111622] border border-[#232d45] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1c2438] pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-100 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>02 / SAR SPECTRAL DECOMPOSITION</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">IoU: 0.6725 • P: 0.905</span>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 text-[10px] bg-[#161d2d] p-1 rounded-lg border border-[#232d45]">
            <button
              onClick={() => setSpectralTab('raw')}
              className={`py-1.5 rounded font-semibold transition ${spectralTab === 'raw' ? 'bg-[#232d45] text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              RAW VV (dB)
            </button>
            <button
              onClick={() => setSpectralTab('prob')}
              className={`py-1.5 rounded font-semibold transition ${spectralTab === 'prob' ? 'bg-[#232d45] text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              U-NET PROB
            </button>
            <button
              onClick={() => setSpectralTab('binary')}
              className={`py-1.5 rounded font-semibold transition ${spectralTab === 'binary' ? 'bg-[#232d45] text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              BINARY MASK
            </button>
          </div>

          {/* Probability Color Gradient Viewer */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg border border-[#232d45] bg-[#0b0e14] overflow-hidden flex items-center justify-center relative">
              {detectionResult?.mask_base64 ? (
                <img
                  src={detectionResult.mask_base64}
                  alt="SAR Overlay"
                  className={`h-full object-contain ${
                    spectralTab === 'raw'
                      ? 'filter grayscale contrast-150 brightness-90'
                      : spectralTab === 'binary'
                      ? 'filter contrast-200 grayscale invert'
                      : 'filter hue-rotate-15'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  {spectralTab === 'raw' && (
                    <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-300 tracking-wider">SENTINEL-1 VV RADAR INTENSITY</span>
                      <span className="text-[9px] text-slate-500 font-mono">Calibrated Sigma0: -25.4 dB to -12.1 dB</span>
                    </div>
                  )}
                  {spectralTab === 'prob' && (
                    <div className="w-full h-full bg-gradient-to-r from-slate-900 via-sky-900 to-red-950 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-sky-300 tracking-wider uppercase bg-[#0b0e14]/90 px-2 py-0.5 rounded border border-[#232d45]">
                        U-NET PROBABILITY MASK [0.0 - 1.0]
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono mt-1">Sigmoid Activated Confidence Heatmap</span>
                    </div>
                  )}
                  {spectralTab === 'binary' && (
                    <div className="w-full h-full bg-black border border-slate-700 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-white tracking-wider">BINARY THRESHOLD MASK</span>
                      <span className="text-[9px] text-emerald-400 font-mono mt-1">Otsu Morphological Cleaned (&gt; 0.50)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gradient Bar Indicator */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-gradient-to-r from-slate-700 via-sky-600 to-red-500"></div>
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>0.0 (Sea Water)</span>
                <span>0.5 (Lookalike)</span>
                <span className="text-slate-300 font-bold">1.0 (Oil Spill)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 03 / ACTION CONSOLE */}
        <div className="space-y-2.5">
          <button
            onClick={() => setIsDossierOpen(true)}
            className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 shadow uppercase tracking-wider"
          >
            <FileText className="w-4 h-4" />
            <span>GENERATE INCIDENT EVIDENCE & AUDIT DOSSIER</span>
          </button>

          <button
            onClick={handleTransmitSitrep}
            className={`w-full py-2.5 px-4 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 border uppercase tracking-wider ${
              sitrepSent
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-[#1c2438] hover:bg-[#232d45] text-slate-200 border border-[#2c3754]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{sitrepSent ? 'SIMULATED SITREP DISPATCHED (DEMO) ✓' : 'SIMULATE SITREP DISPATCH (DEMO)'}</span>
          </button>
        </div>

        {/* 04 / INCIDENT HORIZON TIMELINE SCRUBBER */}
        <div className="bg-[#111622] border border-[#232d45] rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-bold flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>INCIDENT HORIZON & SCRUBBER</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">
              STEP: {timelineHour >= 0 ? `+${timelineHour}h (Forecast)` : `${timelineHour}h (Hindcast)`}
            </span>
          </div>

          {/* Timeline Slider */}
          <input
            type="range"
            min="-6"
            max="8"
            value={timelineHour}
            onChange={(e) => onTimelineChange && onTimelineChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#1c2438] rounded-lg appearance-none cursor-pointer accent-sky-400"
          />

          {/* Quick Jump Buttons */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
            <button
              onClick={() => onTimelineChange && onTimelineChange(-6)}
              className={`py-1 rounded border transition ${timelineHour === -6 ? 'bg-amber-950 text-amber-300 border-amber-500/50' : 'bg-[#161d2d] text-slate-400 border-[#232d45] hover:text-slate-200'}`}
            >
              T-6h Release
            </button>
            <button
              onClick={() => onTimelineChange && onTimelineChange(0)}
              className={`py-1 rounded border transition ${timelineHour === 0 ? 'bg-sky-950 text-sky-300 border-sky-500/50' : 'bg-[#161d2d] text-slate-400 border-[#232d45] hover:text-slate-200'}`}
            >
              T0 SAR Pass
            </button>
            <button
              onClick={() => onTimelineChange && onTimelineChange(4)}
              className={`py-1 rounded border transition ${timelineHour === 4 ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : 'bg-[#161d2d] text-slate-400 border-[#232d45] hover:text-slate-200'}`}
            >
              T+4h Intercept
            </button>
            <button
              onClick={() => onTimelineChange && onTimelineChange(8)}
              className={`py-1 rounded border transition ${timelineHour === 8 ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-[#161d2d] text-slate-400 border-[#232d45] hover:text-slate-200'}`}
            >
              T+8h Landfall
            </button>
          </div>
        </div>
      </div>

      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        scenarioData={scenarioData}
        detectionResult={detectionResult}
        suspect={suspect}
      />
    </>
  );
}
