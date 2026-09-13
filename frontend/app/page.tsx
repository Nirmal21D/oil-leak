'use client';

import React, { useEffect, useState } from 'react';
import TacticalHeader from './components/TacticalHeader';
import MapView from './components/MapView';
import CorrelationMatrix from './components/CorrelationMatrix';
import TacticalSidebar from './components/TacticalSidebar';
import SARUploadControl from './components/SARUploadControl';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('CONNECTING');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timelineHour, setTimelineHour] = useState<number>(0);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  // Tactical Layer Toggles State
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    slick_mask: true,
    drift_cone: true,
    ais_tracks: true,
    dark_vessels: true,
    responder_intercept: true,
    bathymetry: true
  });

  const toggleLayer = (layerKey: string) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
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
      } else {
        throw new Error('API route unavailable');
      }
    } catch (e) {
      // Fallback payload fetch
      try {
        const resFallback = await fetch('/cached_demo_scenario.json');
        if (resFallback.ok) {
          const fData = await resFallback.json();
          setScenarioData(fData);
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

  return (
    <div className="flex flex-col flex-1 bg-[#0b0e14] min-h-screen text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Tactical C2 Header & Telemetry */}
      <TacticalHeader
        apiStatus={apiStatus}
        isBackendConnected={isBackendConnected}
        telemetry={scenarioData?.telemetry}
        activeLayers={activeLayers}
        toggleLayer={toggleLayer}
      />

      {/* Main C2 Tactical Console Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-[1920px] w-full mx-auto">
        {/* Left 2 Columns: Tactical Geospatial Map & AIS Correlation Matrix */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Tactical Map Container */}
          <div className="flex-1 min-h-[500px]">
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
              selectedVessel={selectedVessel}
              onSelectVessel={(vessel) => setSelectedVessel(vessel)}
            />
          </div>

          {/* Bottom AIS Spatio-Temporal Correlation Matrix Table */}
          <CorrelationMatrix
            suspects={scenarioData?.ranked_suspects || []}
            darkVessels={scenarioData?.dark_vessels || []}
            onSelectVessel={(vessel) => setSelectedVessel(vessel)}
          />
        </div>

        {/* Right Column: Live SAR Upload Control & Tactical Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <SARUploadControl onDetectionComplete={(res) => setDetectionResult(res)} />

          <TacticalSidebar
            scenarioData={scenarioData}
            detectionResult={detectionResult}
            primarySuspect={selectedVessel || (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null)}
            timelineHour={timelineHour}
            onTimelineChange={(h) => setTimelineHour(h)}
          />
        </div>
      </main>
    </div>
  );
}
