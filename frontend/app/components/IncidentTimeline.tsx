'use client';

import React from 'react';

interface IncidentTimelineProps {
  timelineHour: number;
  onTimelineChange: (hour: number) => void;
}

export default function IncidentTimeline({
  timelineHour = 0,
  onTimelineChange,
}: IncidentTimelineProps) {
  const steps = [
    { hour: -6, code: 'T-06H', label: 'RELEASE' },
    { hour: 0, code: 'T0', label: 'SAR PASS' },
    { hour: 4, code: 'T+04H', label: 'INTERCEPT' },
    { hour: 8, code: 'T+08H', label: 'LANDFALL' },
  ];

  return (
    <div className="bg-concrete-950 border-2 border-concrete-700 px-4 py-2.5 font-mono select-none text-concrete-100 space-y-2">
      {/* Top Header & State Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center space-x-2">
          <span className="bg-concrete-900 border border-concrete-700 text-safety-orange px-1.5 py-0.5 text-[10px] font-bold uppercase">
            TIMELINE CHRONO
          </span>
          <span className="text-concrete-300 font-bold">
            {timelineHour < 0
              ? `T ${timelineHour}.0H // HINDCAST (ORIGIN RECONSTRUCTION)`
              : timelineHour > 0
              ? `T +${timelineHour}.0H // FORECAST (IMPACT VECTOR)`
              : `T0 // SATELLITE ACQUISITION`}
          </span>
        </div>

        {/* Inline Step Buttons */}
        <div className="flex items-center space-x-1 text-[10px]">
          <button
            onClick={() => onTimelineChange(Math.max(-6, timelineHour - 1))}
            disabled={timelineHour <= -6}
            className="px-2 py-0.5 bg-concrete-900 hover:bg-concrete-800 disabled:opacity-30 border border-concrete-700 text-concrete-200 font-bold"
          >
            [ -1H ]
          </button>
          <button
            onClick={() => onTimelineChange(0)}
            className="px-2 py-0.5 bg-concrete-900 hover:bg-concrete-800 border border-concrete-700 text-concrete-200 font-bold"
          >
            [ T0 ]
          </button>
          <button
            onClick={() => onTimelineChange(Math.min(8, timelineHour + 1))}
            disabled={timelineHour >= 8}
            className="px-2 py-0.5 bg-concrete-900 hover:bg-concrete-800 disabled:opacity-30 border border-concrete-700 text-concrete-200 font-bold"
          >
            [ +1H ]
          </button>
        </div>
      </div>

      {/* Scrubber Rail & Milestone Chips in Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* Continuous Range Rail (7 Cols) */}
        <div className="md:col-span-7 relative flex items-center">
          <div className="w-full h-2 bg-concrete-900 border border-concrete-700 relative">
            <div
              className="absolute top-0 bottom-0 bg-safety-orange/40 border-r-2 border-safety-orange transition-all duration-75"
              style={{
                left: `${((Math.min(timelineHour, 0) + 6) / 14) * 100}%`,
                width: `${(Math.abs(timelineHour) / 14) * 100}%`,
              }}
            />
            {/* Live Slider Indicator */}
            <div
              className="absolute -top-2.5 w-3 h-6 bg-safety-orange border border-concrete-100 shadow-[0_0_8px_rgba(255,85,0,0.6)] pointer-events-none -translate-x-1/2 z-10"
              style={{ left: `${((timelineHour + 6) / 14) * 100}%` }}
            />
          </div>

          <input
            type="range"
            min="-6"
            max="8"
            step="1"
            value={timelineHour}
            onChange={(e) => onTimelineChange(parseInt(e.target.value))}
            className="w-full h-4 opacity-0 cursor-pointer absolute top-0 left-0 z-20"
          />
        </div>

        {/* Milestone Quick Jump Buttons (5 Cols) */}
        <div className="md:col-span-5 grid grid-cols-4 gap-1">
          {steps.map((step) => {
            const isSelected = timelineHour === step.hour;
            return (
              <button
                key={step.hour}
                onClick={() => onTimelineChange(step.hour)}
                className={`py-1 text-center border text-[10px] font-bold transition ${
                  isSelected
                    ? 'bg-safety-orange text-concrete-950 border-safety-orange font-black'
                    : 'bg-concrete-900 border-concrete-800 text-concrete-400 hover:text-concrete-200'
                }`}
              >
                {step.code}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
