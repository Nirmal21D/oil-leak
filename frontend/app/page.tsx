'use client';

import React, { useEffect, useState } from 'react';
import BrutalistHeader from './components/BrutalistHeader';
import TacticalSidebar from './components/TacticalSidebar';
import ContextualIntelPanel from './components/ContextualIntelPanel';
import MapView from './components/MapView';
import IncidentTimeline from './components/IncidentTimeline';
import SARWorkspace from './components/SARWorkspace';
import CorrelationMatrix from './components/CorrelationMatrix';
import ResponderVectorPanel from './components/ResponderVectorPanel';
import EvidenceChainBanner from './components/EvidenceChainBanner';
import DataProvenanceStrip from './components/DataProvenanceStrip';
import DossierModal from './components/DossierModal';
import { formatCoordinate } from './utils/geo';

type ModuleType = 'overview' | 'sar' | 'drift' | 'ais' | 'responder';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('CONNECTING');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [timelineHour, setTimelineHour] = useState<number>(0);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Active Tactical Investigation Phase
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');

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
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/scenario/current');
      if (res.ok) {
        const data = await res.json();
        setScenarioData(data);
        setIsBackendConnected(true);
        setApiStatus('ONLINE');
        if (data.ranked_suspects && data.ranked_suspects.length > 0) {
          setSelectedVessel(data.ranked_suspects[0]);
        }
      } else {
        setApiStatus('OFFLINE');
        setIsBackendConnected(false);
      }
    } catch (err) {
      console.warn('Backend connection failed:', err);
      setApiStatus('DISCONNECTED');
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarioData();
  }, []);

  // Golden Scenario Quick-Trigger
  const handleRunGoldenPreset = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/detect/preset/00111', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setDetectionResult(data);
        if (data.scenario_update) {
          setScenarioData(data.scenario_update);
          if (data.scenario_update.ranked_suspects?.length > 0) {
            setSelectedVessel(data.scenario_update.ranked_suspects[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to run golden preset:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectVessel = (vessel: any) => {
    setSelectedVessel(vessel);
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

  const activeCandidate =
    selectedVessel ||
    (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);

  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;
  const areaKm2 = morphology?.area_sq_km != null ? morphology.area_sq_km : undefined;
  const volumeM3 = morphology?.estimated_volume_m3 != null ? morphology.estimated_volume_m3 : undefined;

  const sceneBounds = scenarioData?.scene_bounds || detectionResult?.leaflet_bounds;
  const detectedPolygons = detectionResult?.leaflet_polygons || scenarioData?.detected_polygons || [];
  const isGeoreferenced = detectionResult ? detectionResult.scene_georeferenced : (scenarioData?.scene_georeferenced ?? true);
  const georeferenceStatus = detectionResult?.georeference_status || scenarioData?.georeference_status;

  const parseCoords = (c: any) => {
    if (!c) return null;
    const lat = typeof c.lat === 'number' ? c.lat : (Array.isArray(c) ? c[0] : null);
    const lon = typeof c.lon === 'number' ? c.lon : (Array.isArray(c) ? c[1] : null);
    if (lat != null && lon != null) return { lat, lon };
    return null;
  };

  const observedCoordinates = scenarioData?.location
    ? { lat: scenarioData.location.lat, lon: scenarioData.location.lon }
    : (parseCoords(detectionResult?.slick_centroid)
        || parseCoords(detectionResult?.scene_center)
        || null);

  return (
    <div className="flex flex-col min-h-screen bg-tactical-base text-tactical-text font-sans selection:bg-tactical-amber selection:text-tactical-base bg-technical-grid">
      
      {/* 01 Tactical C2 Header */}
      <BrutalistHeader
        apiStatus={apiStatus}
        isBackendConnected={isBackendConnected}
        telemetry={scenarioData?.telemetry}
        incidentCoordinates={observedCoordinates}
        incidentId={scenarioData?.scenario_id || (isBackendConnected ? 'STANDBY' : 'OFFLINE')}
        onOpenDossier={() => setIsDossierOpen(true)}
        onRunGolden={handleRunGoldenPreset}
        isProcessing={isProcessing}
      />

      {/* 02 Persistent Data Feeds Telemetry Strip */}
      <DataProvenanceStrip
        scenarioData={scenarioData}
        detectionResult={detectionResult}
      />

      {/* 03 Global Evidence Chain Workflow Banner */}
      <EvidenceChainBanner
        scenarioData={scenarioData}
        detectionResult={detectionResult}
        activePhase={activeModule}
        onSelectPhase={(phase) => setActiveModule(phase)}
      />

      {/* 04 Main Tactical Tri-Pane Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row p-2 lg:p-3 gap-2 min-h-0">
        
        {/* Left Column: Fixed Navigation & Layer Matrix (260px) */}
        <TacticalSidebar
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
          activeLayers={activeLayers}
          onToggleLayer={toggleLayer}
          onOpenDossier={() => setIsDossierOpen(true)}
          scenarioData={scenarioData}
          detectionResult={detectionResult}
        />

        {/* Center Column: Dominant Tactical Map (~65-70% visual hero) */}
        <div className="flex-1 flex flex-col space-y-2 min-w-0">
          
          {/* Tactical Map Viewport Instrument */}
          <div className="h-[520px] lg:h-[580px] w-full border border-tactical-border relative bg-tactical-base shadow-[2px_2px_0px_#070B0F]">
            
            {/* Map Instrument Top Frame Status */}
            <div className="absolute top-2 left-2 z-[400] bg-tactical-navy/90 border border-tactical-border px-2.5 py-1 text-[10px] font-mono text-tactical-text flex items-center space-x-3 pointer-events-none">
              <div>
                <span className="text-tactical-dim">SCENE: </span>
                <strong className="text-tactical-amber font-bold">
                  {detectionResult?.image_name || scenarioData?.scenario_id || '—'}
                </strong>
              </div>
              <span className="text-tactical-border">•</span>
              <div>
                <span className="text-tactical-dim">SECTOR: </span>
                <strong className="text-tactical-text">
                  {scenarioData?.sector || (scenarioData ? 'ACTIVE MARITIME SECTOR' : '—')}
                </strong>
              </div>
              <span className="text-tactical-border hidden sm:inline">•</span>
              <div className="hidden sm:block">
                <span className="text-tactical-dim">COORDINATES: </span>
                <span className="text-tactical-muted">
                  {observedCoordinates ? formatCoordinate(observedCoordinates.lat, observedCoordinates.lon) : '—'}
                </span>
              </div>
            </div>

            {/* Tactical Leaflet Map */}
            <MapView
              centerLat={observedCoordinates?.lat}
              centerLon={observedCoordinates?.lon}
              sceneBounds={sceneBounds}
              detectedPolygons={detectedPolygons}
              isGeoreferenced={isGeoreferenced}
              georeferenceStatus={georeferenceStatus}
              suspects={scenarioData?.ranked_suspects || []}
              darkVessels={scenarioData?.dark_vessels || []}
              hindcastTrajectory={scenarioData?.hindcast_trajectory || []}
              driftConePolygon={scenarioData?.drift_cone_polygon || []}
              responderRoute={scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing}
              reconstructedRelease={scenarioData?.reconstructed_release}
              infraData={scenarioData?.infrastructure_proximity}
              activeLayers={activeLayers}
              timelineHour={timelineHour}
              selectedVessel={activeCandidate}
              onSelectVessel={handleSelectVessel}
              slickAreaKm2={areaKm2}
              slickVolumeM3={volumeM3}
              telemetry={scenarioData?.telemetry}
            />
          </div>

          {/* Compact Chrono Timeline Scrubber */}
          <IncidentTimeline
            timelineHour={timelineHour}
            onTimelineChange={(h) => setTimelineHour(h)}
          />

          {/* Contextual Center Drawer for Deep Modular Investigation */}
          {activeModule === 'sar' && (
            <div className="pt-1">
              <SARWorkspace
                detectionResult={detectionResult}
                onDetectionComplete={handleDetectionComplete}
              />
            </div>
          )}

          {activeModule === 'ais' && (
            <div className="pt-1">
              <CorrelationMatrix
                suspects={scenarioData?.ranked_suspects || []}
                darkVessels={scenarioData?.dark_vessels || []}
                selectedVessel={activeCandidate}
                onSelectVessel={handleSelectVessel}
                aisProvenance={scenarioData?.ais_provenance}
                isHistoricalReal={scenarioData?.is_historical_real}
                coverageAvailable={scenarioData?.coverage_available}
                releaseWindow={scenarioData?.release_window}
              />
            </div>
          )}

          {activeModule === 'responder' && (
            <div className="pt-1">
              <ResponderVectorPanel
                responderRoute={scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing}
              />
            </div>
          )}

        </div>

        {/* Right Column: Contextual Intelligence Panel (380px) */}
        <ContextualIntelPanel
          activeModule={activeModule}
          scenarioData={scenarioData}
          detectionResult={detectionResult}
          selectedVessel={activeCandidate}
          onSelectVessel={handleSelectVessel}
          onOpenDossier={() => setIsDossierOpen(true)}
          onSwitchModule={(mod) => setActiveModule(mod)}
        />

      </main>

      {/* 04 Bottom Signature Interactive Evidence Chain Banner */}
      <EvidenceChainBanner
        scenarioData={scenarioData}
        detectionResult={detectionResult}
        activePhase={activeModule}
        onSelectPhase={(phase) => setActiveModule(phase)}
      />

      {/* 05 7-Page Maritime Incident Evidence & Investigation Dossier Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        scenarioData={scenarioData}
        detectionResult={detectionResult}
        suspect={activeCandidate}
      />

    </div>
  );
}
