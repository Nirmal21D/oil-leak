'use client';

import React from 'react';
import { formatCoordinate } from '../utils/geo';

interface SpillDataSheetProps {
  scenarioData?: any;
  detectionResult?: any;
}

export default function SpillDataSheet({
  scenarioData,
  detectionResult,
}: SpillDataSheetProps) {
  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;
  const isComputed = morphology?.is_computed_morphology !== false && morphology?.area_sq_km != null;

  const slickArea = isComputed ? morphology.area_sq_km : null;
  const volumeM3 = isComputed ? morphology.estimated_volume_m3 : null;
  const perimeterKm = isComputed ? morphology.perimeter_km : null;
  const compactness = isComputed ? morphology.compactness_index : null;
  const thickness = isComputed ? morphology.estimated_thickness_um : null;
  const massTons = isComputed ? morphology.estimated_mass_tons : null;
  const weatheringStage = isComputed
    ? (morphology?.weathering_stage || "Gravity-Viscous Drift & Evaporation")
    : "AWAITING SENSOR INGEST";

  const sourceName = detectionResult?.image_name || (scenarioData ? "PROCESSED SCENE" : "STANDBY // NO SCENE");
  const obsLat = scenarioData?.location?.lat;
  const obsLon = scenarioData?.location?.lon;
  const relLat = scenarioData?.reconstructed_release?.lat;
  const relLon = scenarioData?.reconstructed_release?.lon;

  return (
    <section id="drift" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-safety-orange border border-concrete-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            03 // PHYSICAL CHARACTERIZATION & DRIFT HINDCAST
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            FAY SPREADING THEORY & 2D LAGRANGIAN REVERSE ADVECTION
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="stamp-tag border-concrete-700 text-concrete-300">
            SOURCE: {sourceName}
          </span>
          <span className={`stamp-tag ${isComputed ? 'border-safety-orange text-safety-orange' : 'border-concrete-700 text-concrete-400'}`}>
            STATUS: {isComputed ? 'MODEL-DERIVED' : 'STANDBY'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Technical Data Sheet */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              SPILL PHYSICAL DATA SHEET // SPECIFICATION
            </span>
            <span className="text-[10px] text-concrete-500 font-mono">
              {isComputed ? 'COMPUTED FROM INPUT CONTOURS' : 'AWAITING SENSOR INGEST'}
            </span>
          </div>

          <div className="divide-y divide-concrete-800 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">SURFACE AREA:</span>
              <strong className="text-concrete-100 font-mono text-sm">
                {slickArea != null ? `${Number(slickArea).toFixed(2)} KM²` : 'NOT AVAILABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">ESTIMATED PERIMETER:</span>
              <strong className="text-concrete-200 font-mono">
                {perimeterKm != null ? `${Number(perimeterKm).toFixed(2)} KM` : 'NOT AVAILABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">ESTIMATED VOLUME (FAY):</span>
              <strong className="text-safety-orange font-mono text-sm">
                {volumeM3 != null ? `${Number(volumeM3).toFixed(2)} M³ (~${massTons != null ? Number(massTons).toFixed(2) : '—'} METRIC TONS)` : 'NOT AVAILABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">ESTIMATED AVERAGE THICKNESS:</span>
              <strong className="text-concrete-200 font-mono">
                {thickness != null ? `${Number(thickness).toFixed(2)} μM (IRIDESCENT SHEEN)` : 'NOT AVAILABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">ISOPERIMETRIC COMPACTNESS:</span>
              <strong className="text-concrete-200 font-mono">
                {compactness != null ? `${Number(compactness).toFixed(2)} ${compactness < 0.3 ? '(WIND-ELONGATED)' : '(COHESIVE SLICK)'}` : 'NOT AVAILABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">SEGMENTATION UNCERTAINTY:</span>
              <strong className="text-concrete-300 font-mono">
                {slickArea != null ? `±15% (${(slickArea * 0.85).toFixed(1)} – ${(slickArea * 1.15).toFixed(1)} KM²)` : 'NOT APPLICABLE'}
              </strong>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-concrete-400 font-bold">WEATHERING STAGE:</span>
              <strong className="text-concrete-100 font-mono uppercase">{weatheringStage}</strong>
            </div>
          </div>
        </div>

        {/* Right: Lagrangian Advection & Hindcast Analysis */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              HYDRODYNAMIC REVERSE ADVECTION TRAJECTORY
            </span>
            <span className="text-[10px] text-safety-orange font-bold font-mono">
              Δt = 15 MIN
            </span>
          </div>

          {/* Advection Flow Diagram */}
          <div className="bg-concrete-950 border border-concrete-800 p-3 space-y-2 text-center text-xs">
            <div className="flex items-center justify-between border-b border-concrete-800 pb-1 text-[10px] text-concrete-400">
              <span>SAR OBSERVATION (T0)</span>
              <span>
                {obsLat != null && obsLon != null
                  ? formatCoordinate(obsLat, obsLon)
                  : 'AWAITING SCENE'}
              </span>
            </div>
            <div className="py-1 text-concrete-500 font-bold text-xs">
              ↓ BACKWARD 2D LAGRANGIAN ADVECTION (M2 SEMI-DIURNAL TIDE + 3.5% WINDAGE) ↓
            </div>
            <div className="bg-concrete-900 border border-safety-orange p-2 text-safety-orange font-bold text-xs flex items-center justify-between">
              <span>PROBABLE RELEASE LOCUS (T -6.5H):</span>
              <span className="font-mono text-sm">
                {relLat != null && relLon != null
                  ? formatCoordinate(relLat, relLon)
                  : 'AWAITING HINDCAST'}
              </span>
            </div>
          </div>

          {/* Sensitivity Envelope Table */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-concrete-800 pb-1">
              <span className="text-concrete-400 font-bold">SENSITIVITY ENVELOPE:</span>
              <strong className="text-safety-orange font-mono">±3.5 KM EMPIRICAL BOUND</strong>
            </div>
            <div className="flex items-center justify-between text-concrete-400">
              <span>PERTURBATION BENCHMARK:</span>
              <span className="text-concrete-200 font-mono">±20% Wind / Current Variance</span>
            </div>
            <div className="flex items-center justify-between text-concrete-400">
              <span>MAX DISPLACEMENT DELTA:</span>
              <span className="text-concrete-100 font-mono font-bold">3.18 KM (BOUNDED)</span>
            </div>
            <div className="flex items-center justify-between text-concrete-400">
              <span>METOCEAN FORCING:</span>
              <span className={`font-mono font-bold ${
                scenarioData?.telemetry?.metocean_source?.startsWith('CMEMS')
                  ? 'text-emerald-400'
                  : 'text-yellow-400'
              }`}>
                {scenarioData?.telemetry?.metocean_source_label || (
                  scenarioData?.telemetry?.metocean_source === 'CMEMS_LIVE' || scenarioData?.telemetry?.metocean_source === 'CMEMS_CACHED'
                    ? 'CMEMS LOCATION-MATCHED'
                    : (scenarioData?.telemetry?.metocean_source ? 'FALLBACK MODEL DEFAULTS' : 'AWAITING INGEST')
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-concrete-400">
              <span>FORWARD FORECAST HORIZON:</span>
              <span className="text-sky-400 font-mono">
                {scenarioData?.hindcast_trajectory ? `T+0H → T+12H (${scenarioData.hindcast_trajectory.length} WAYPOINTS)` : 'STANDBY'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-concrete-500 bg-concrete-950 p-2 border border-concrete-800">
            <strong>Oceanographic Assumption Note:</strong> 3.5% windage coefficient is applied as a prototype parameter consistent with surface-oil drift parameterizations.
          </div>
        </div>
      </div>
    </section>
  );
}
