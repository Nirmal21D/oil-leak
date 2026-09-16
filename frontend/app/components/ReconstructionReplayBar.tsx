'use client';

import React from 'react';

export interface ReconstructionReplayBarProps {
  isOpen: boolean;
  isPlaying: boolean;
  currentStep: number; // 1 to 4
  onTogglePlay: () => void;
  onSelectStep: (step: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onClose: () => void;
  speed: number;
  onToggleSpeed: () => void;
}

const REPLAY_STEPS = [
  {
    step: 1,
    id: 'sar',
    label: '01 SAR OBSERVATION',
    timeLabel: 'T0 ACQUISITION',
    subtitle:
      '🛰️ Step 1: Satellite SAR Observation — Sentinel-1 radar detects a 5.6 km² dark surface feature at 28.9668° N, 88.8937° W at T0.',
  },
  {
    step: 2,
    id: 'drift',
    label: '02 DRIFT HINDCAST',
    timeLabel: 'T0 → T−6.5H',
    subtitle:
      '🌊 Step 2: Backward Drift Reconstruction — Coupled Copernicus ocean currents and windage reconstruct the discharge locus 6.5 hours prior. (Observed slick remains anchored at T0).',
  },
  {
    step: 3,
    id: 'ais',
    label: '03 AIS CORRELATION',
    timeLabel: 'T−6.5H WINDOW',
    subtitle:
      '🚢 Step 3: AIS Historical Correlation — Primary candidate vessel transit recorded within 1.92 km of the reconstructed release locus during the discharge window.',
  },
  {
    step: 4,
    id: 'responder',
    label: '04 EVIDENCE & LOGISTICS',
    timeLabel: 'PORT DISCOVERY',
    subtitle:
      '📋 Step 4: Forensic Evidence & Logistics — Primary candidate flagged (Attribution Index 55.9/100). Nearest response infrastructure: Port Sulphur (Geodesic reference: 95.8 km).',
  },
];

export default function ReconstructionReplayBar({
  isOpen,
  isPlaying,
  currentStep,
  onTogglePlay,
  onSelectStep,
  onNextStep,
  onPrevStep,
  onClose,
  speed,
  onToggleSpeed,
}: ReconstructionReplayBarProps) {
  if (!isOpen) return null;

  const currentStepData = REPLAY_STEPS[currentStep - 1] || REPLAY_STEPS[0];

  return (
    <div className="bg-tactical-navy/95 border-2 border-tactical-amber shadow-2xl p-3 font-mono text-xs select-none backdrop-blur-md animate-fadeIn">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tactical-border/80 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-tactical-amber animate-pulse"></span>
          <span className="font-extrabold text-tactical-amber tracking-wider text-[11px] uppercase">
            ▶ INVESTIGATION RECONSTRUCTION REPLAY
          </span>
          <span className="text-[9px] text-tactical-dim border border-tactical-border px-1.5 py-0.5 bg-tactical-panel hidden sm:inline">
            GUIDED FORENSIC WALKTHROUGH
          </span>
        </div>

        {/* Step Buttons */}
        <div className="flex items-center space-x-1">
          {REPLAY_STEPS.map((s) => (
            <button
              key={s.step}
              onClick={() => onSelectStep(s.step)}
              className={`px-2 py-1 text-[10px] font-bold border transition cursor-pointer flex items-center space-x-1 ${
                currentStep === s.step
                  ? 'bg-tactical-amber text-tactical-base border-tactical-amber'
                  : 'bg-tactical-panel text-tactical-muted border-tactical-border hover:text-tactical-text hover:border-tactical-muted'
              }`}
            >
              <span>{s.step}</span>
              <span className="hidden md:inline">{s.id.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Playback Controls & Close */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onPrevStep}
            disabled={currentStep <= 1}
            className="px-2 py-1 bg-tactical-panel hover:bg-tactical-hover text-tactical-text border border-tactical-border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] font-bold"
            title="Previous Step"
          >
            ⏮ PREV
          </button>
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1 font-black text-[10px] border transition cursor-pointer flex items-center space-x-1 ${
              isPlaying
                ? 'bg-tactical-amber text-tactical-base border-tactical-amber'
                : 'bg-tactical-panel text-tactical-amber border-tactical-amber hover:bg-tactical-hover'
            }`}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
          <button
            onClick={onNextStep}
            disabled={currentStep >= 4}
            className="px-2 py-1 bg-tactical-panel hover:bg-tactical-hover text-tactical-text border border-tactical-border disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[10px] font-bold"
            title="Next Step"
          >
            NEXT ⏭
          </button>
          <button
            onClick={onToggleSpeed}
            className="px-2 py-1 bg-tactical-panel hover:bg-tactical-hover text-tactical-cyan border border-tactical-border cursor-pointer text-[10px] font-bold"
            title="Playback Speed"
          >
            {speed}X
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 bg-tactical-panel hover:bg-red-900/60 text-tactical-muted hover:text-red-400 border border-tactical-border cursor-pointer text-[10px] font-bold ml-1"
            title="Exit Replay Mode"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Subtitle / Factual Narrative Display */}
      <div className="bg-tactical-panel border border-tactical-border/70 px-3 py-2 flex items-start space-x-2">
        <div className="shrink-0 mt-0.5">
          <span className="bg-tactical-navy text-tactical-amber border border-tactical-amber/50 px-1.5 py-0.5 text-[9px] font-bold uppercase">
            STEP 0{currentStep} // {currentStepData.timeLabel}
          </span>
        </div>
        <p className="text-tactical-text text-xs leading-relaxed font-sans font-medium flex-1">
          {currentStepData.subtitle}
        </p>
      </div>
    </div>
  );
}
