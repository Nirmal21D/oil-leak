'use client';

import React, { useEffect, useState } from 'react';
import BrutalistHeader from './components/BrutalistHeader';
import IncidentHero from './components/IncidentHero';
import BrutalistLayers from './components/BrutalistLayers';
import MapView from './components/MapView';
import IncidentTimeline from './components/IncidentTimeline';
import CorrelationMatrix from './components/CorrelationMatrix';
import ForensicAttributionPanel from './components/ForensicAttributionPanel';
import SARWorkspace from './components/SARWorkspace';
import SpillDataSheet from './components/SpillDataSheet';
import CFARRadarPanel from './components/CFARRadarPanel';
import ResponderVectorPanel from './components/ResponderVectorPanel';
import DossierModal from './components/DossierModal';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('CONNECTING');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timelineHour, setTimelineHour] = useState<number>(0);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Active Intelligence Workspace Module State (Default: attribution)
  const [activeModule, setActiveModule] = useState<
    'attribution' | 'sar' | 'drift' | 'cfar' | 'responder'
  >('attribution');

  // Tactical Layer Toggles State
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    slick_mask: true,
    drift_cone: true,
    ais_tracks: true,
    dark_vessels: true,
    responder_intercept: true,
    bathymetry: true,
    sar_scene: true,
    oil_mask: true,
    lookalike_mask: true,
    spill_centroid: true,
    hindcast: true,
    forecast: true,
    uncertainty: true,
    ais_traffic: true,
    investigative_leads: true,
    dark_targets: true,
    responder_vector: true,
  });

  const toggleLayer = (layerKey: string) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const fetchScenarioData = async () => {
    setLoading(true);
    try {
      const resHealth = await fetch('http://localhost:8000/api/v1/health');
      if (resHealth.ok) {
        const hData = await resHealth.json();
        setApiStatus(`ONLINE (${hData.device})`);
        setIsBackendConnected(true);
      } else {
        setApiStatus('OFFLINE (FALLBACK)');
        setIsBackendConnected(false);
      }
    } catch (e) {
      setApiStatus('CACHED / FALLBACK MODE');
      setIsBackendConnected(false);
    }

    try {
      const resScenario = await fetch('http://localhost:8000/api/v1/attribution/demo-scenario');
      if (resScenario.ok) {
        const sData = await resScenario.json();
        setScenarioData(sData);
        if (sData?.ranked_suspects && sData.ranked_suspects.length > 0) {
          setSelectedVessel(sData.ranked_suspects[0]);
        }
      } else {
        throw new Error('API route unavailable');
      }
    } catch (e) {
      try {
        const resFallback = await fetch('/cached_demo_scenario.json');
        if (resFallback.ok) {
          const fData = await resFallback.json();
          setScenarioData(fData);
          if (fData?.ranked_suspects && fData.ranked_suspects.length > 0) {
            setSelectedVessel(fData.ranked_suspects[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load scenario data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarioData();
  }, []);



  const handleSelectVessel = (vessel: any) => {
    setSelectedVessel(vessel);
    if (vessel.vessel_type?.includes('CFAR') || vessel.dark_target_id) {
      setActiveModule('cfar');
    } else {
      setActiveModule('attribution');
    }
  };

  const handleDetectionComplete = (res: any) => {
    setDetectionResult(res);
    if (res.scenario_update) {
      setScenarioData(res.scenario_update);
      if (res.scenario_update.ranked_suspects && res.scenario_update.ranked_suspects.length > 0) {
        setSelectedVessel(res.scenario_update.ranked_suspects[0]);
      }
    }
  };

  const activeSuspect =
    selectedVessel ||
    (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);

  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;

  const areaKm2 = morphology?.area_sq_km ?? 14.8;
  const volumeM3 = morphology?.estimated_volume_m3 ?? 31.8;
  const perimeterKm = morphology?.perimeter_km ?? 28.4;
  const compactness = morphology?.compactness_index ?? 0.23;
  const estimatedMassTons = morphology?.estimated_mass_tons ?? 27.7;
  const thicknessUm = morphology?.estimated_thickness_um ?? 2.12;

  const observedCoordinates = scenarioData?.location
    ? { lat: scenarioData.location.lat, lon: scenarioData.location.lon }
    : { lat: 19.4120, lon: 71.3250 };
  const releaseCoordinates = scenarioData?.reconstructed_release
    ? { lat: scenarioData.reconstructed_release.lat, lon: scenarioData.reconstructed_release.lon }
    : { lat: 19.4733, lon: 71.2097 };

  const sourceLabel = detectionResult ? `LIVE: ${detectionResult.image_name}` : 'MODEL-DERIVED';

  return (
    <div className="flex flex-col min-h-screen bg-concrete-950 text-concrete-100 font-sans selection:bg-safety-orange selection:text-concrete-950 bg-technical-grid">
      {/* 01 Architectural Header */}
      <BrutalistHeader
        apiStatus={apiStatus}
        isBackendConnected={isBackendConnected}
        telemetry={scenarioData?.telemetry}
        incidentCoordinates={releaseCoordinates}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* 02 Streamlined Incident Hero Strip (Compact single row) */}
      <IncidentHero
        areaKm2={areaKm2}
        volumeM3={volumeM3}
        sensitivityKm={3.5}
        priorityScore={activeSuspect?.attribution_score_pct || 93.1}
        primarySuspectName={activeSuspect?.vessel_name || 'MT OCEAN PIONEER'}
        perimeterKm={perimeterKm}
        compactness={compactness}
        estimatedMassTons={estimatedMassTons}
        thicknessUm={thicknessUm}
        observedCoordinates={observedCoordinates}
        releaseCoordinates={releaseCoordinates}
        sourceLabel={sourceLabel}
        onOpenDossier={() => setIsDossierOpen(true)}
        onSelectModule={(mod: any) => setActiveModule(mod)}
      />

      {/* 03 11-Layer Evidence Switchboard */}
      <BrutalistLayers activeLayers={activeLayers} toggleLayer={toggleLayer} />

      {/* 04 Main Tactical Command Center Grid (Side-by-Side Unified Workspace) */}
      <main className="flex-1 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1920px] w-full mx-auto">
        {/* Left 7 Columns: Tactical Map, Compact Timeline Scrubber & Correlation Table */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Tactical Map Container */}
          <div className="h-[460px] shadow-[4px_4px_0px_#141820]">
            <MapView
              centerLat={scenarioData?.location?.lat || 19.412}
              centerLon={scenarioData?.location?.lon || 71.325}
              suspects={scenarioData?.ranked_suspects || []}
              darkVessels={scenarioData?.dark_vessels || []}
              hindcastTrajectory={scenarioData?.hindcast_trajectory || []}
              driftConePolygon={scenarioData?.drift_cone_polygon || []}
              responderRoute={scenarioData?.responder_route}
              reconstructedRelease={scenarioData?.reconstructed_release}
              infraData={scenarioData?.infrastructure_proximity}
              activeLayers={activeLayers}
              timelineHour={timelineHour}
              selectedVessel={activeSuspect}
              onSelectVessel={handleSelectVessel}
              slickAreaKm2={areaKm2}
              slickVolumeM3={volumeM3}
            />
          </div>

          {/* Compact Horizontal Engineering Timeline Scrubber */}
          <IncidentTimeline
            timelineHour={timelineHour}
            onTimelineChange={(h) => setTimelineHour(h)}
          />

          {/* AIS Spatio-Temporal Correlation Matrix Table */}
          <CorrelationMatrix
            suspects={scenarioData?.ranked_suspects || []}
            darkVessels={scenarioData?.dark_vessels || []}
            selectedVessel={activeSuspect}
            onSelectVessel={handleSelectVessel}
          />
        </div>

        {/* Right 5 Columns: Dedicated Workspace with Architectural Module Switcher */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Architectural Module Switcher Tabs Bar */}
          <div className="bg-concrete-900 border-2 border-concrete-700 p-1 font-mono flex items-center overflow-x-auto gap-1 text-xs select-none">
            <button
              onClick={() => setActiveModule('attribution')}
              className={`px-3 py-1.5 font-bold tracking-wider uppercase border transition flex items-center space-x-1.5 ${
                activeModule === 'attribution'
                  ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              <span>01 ATTRIBUTION</span>
              <span className="text-[9px] opacity-75">{(activeSuspect?.attribution_score_pct || 93.1).toFixed(1)}</span>
            </button>

            <button
              onClick={() => setActiveModule('sar')}
              className={`px-3 py-1.5 font-bold tracking-wider uppercase border transition flex items-center space-x-1.5 ${
                activeModule === 'sar'
                  ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              <span>02 SAR PIPELINE</span>
              <span className="text-[9px] opacity-75">67.2%</span>
            </button>

            <button
              onClick={() => setActiveModule('drift')}
              className={`px-3 py-1.5 font-bold tracking-wider uppercase border transition flex items-center space-x-1.5 ${
                activeModule === 'drift'
                  ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              <span>03 DRIFT / FAY</span>
              <span className="text-[9px] opacity-75">±3.5KM</span>
            </button>

            <button
              onClick={() => setActiveModule('cfar')}
              className={`px-3 py-1.5 font-bold tracking-wider uppercase border transition flex items-center space-x-1.5 ${
                activeModule === 'cfar'
                  ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              <span>04 CFAR RADAR</span>
              <span className="text-[9px] opacity-75">18.5dB</span>
            </button>

            <button
              onClick={() => setActiveModule('responder')}
              className={`px-3 py-1.5 font-bold tracking-wider uppercase border transition flex items-center space-x-1.5 ${
                activeModule === 'responder'
                  ? 'bg-safety-orange text-concrete-950 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              <span>05 RESPONDER</span>
              <span className="text-[9px] opacity-75">T+4.1H</span>
            </button>
          </div>

          {/* Active Workspace Module Container (Only 1 Active at a Time!) */}
          <div className="space-y-3">
            {activeModule === 'attribution' && (
              <ForensicAttributionPanel
                suspect={activeSuspect}
                onOpenDossier={() => setIsDossierOpen(true)}
              />
            )}

            {activeModule === 'sar' && (
              <SARWorkspace
                detectionResult={detectionResult}
                onDetectionComplete={handleDetectionComplete}
              />
            )}

            {activeModule === 'drift' && (
              <SpillDataSheet
                scenarioData={scenarioData}
                detectionResult={detectionResult}
              />
            )}

            {activeModule === 'cfar' && (
              <CFARRadarPanel
                darkVessels={scenarioData?.dark_vessels || []}
                onSelectVessel={handleSelectVessel}
              />
            )}

            {activeModule === 'responder' && (
              <ResponderVectorPanel
                responderRoute={scenarioData?.responder_route}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer Technical Bar */}
      <footer className="border-t border-concrete-700 bg-concrete-950 px-4 py-2.5 font-mono text-[11px] text-concrete-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="bg-concrete-900 border border-concrete-700 text-safety-orange px-1.5 py-0.5 text-[10px] font-bold">
            AEGISSEA C2
          </span>
          <span>SIH PS 26143 // NTRO PROTOTYPE WORKSTATION</span>
        </div>

        <div className="flex items-center space-x-3 text-concrete-400 text-[10px]">
          <span>ZENODO HELD-OUT: 67.25% IoU</span>
          <span>•</span>
          <span>CONTROLLED BENCHMARK: 100% RANK-1</span>
          <span>•</span>
          <span>SENSITIVITY ENVELOPE: ±3.5 KM</span>
        </div>
      </footer>

      {/* Incident Evidence & Audit Dossier Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        scenarioData={scenarioData}
        detectionResult={detectionResult}
        suspect={activeSuspect}
      />
    </div>
  );
}
