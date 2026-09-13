'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

interface MapViewProps {
  centerLat?: number;
  centerLon?: number;
  suspects?: any[];
  darkVessels?: any[];
  hindcastTrajectory?: any[];
  driftConePolygon?: any[];
  responderRoute?: any;
  reconstructedRelease?: any;
  infraData?: any;
  activeLayers?: Record<string, boolean>;
  timelineHour?: number;
  selectedVessel?: any;
  onSelectVessel?: (vessel: any) => void;
  slickAreaKm2?: number;
  slickVolumeM3?: number;
}

export default function MapView({
  centerLat = 19.412,
  centerLon = 71.325,
  suspects = [],
  darkVessels = [],
  hindcastTrajectory = [],
  driftConePolygon = [],
  responderRoute,
  reconstructedRelease,
  infraData,
  activeLayers,
  timelineHour = 0,
  selectedVessel,
  onSelectVessel,
  slickAreaKm2 = 14.8,
  slickVolumeM3 = 31.8,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setLeafletLoaded(true);
    });
  }, []);

  if (!mounted || !leafletLoaded) {
    return (
      <div className="w-full h-full min-h-[460px] flex items-center justify-center bg-concrete-950 border-2 border-concrete-700 font-mono">
        <div className="text-center space-y-3 p-6 border border-concrete-800 bg-concrete-900">
          <div className="w-6 h-6 border-2 border-safety-orange border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-concrete-300 font-bold uppercase tracking-wider">
            INITIALIZING TACTICAL MAP SURFACE...
          </p>
          <span className="text-[10px] text-concrete-500">
            ESRI DARK CANVAS // WGS-84 METRIC PROJECTION
          </span>
        </div>
      </div>
    );
  }

  // Dynamic interpolated slick position based on timelineHour (-6 to +8)
  const originLat = reconstructedRelease?.lat || 19.4733;
  const originLon = reconstructedRelease?.lon || 71.2097;

  let activeSlickLat = centerLat;
  let activeSlickLon = centerLon;

  if (timelineHour < 0) {
    // Hindcast mode: interpolate between T0 center and T-6 release origin
    const ratio = Math.abs(timelineHour) / 6.0;
    const clampedRatio = Math.min(ratio, 1.0);
    activeSlickLat = centerLat + (originLat - centerLat) * clampedRatio;
    activeSlickLon = centerLon + (originLon - centerLon) * clampedRatio;
  } else if (timelineHour > 0) {
    // Forecast mode: project forward along heading ~124.3° (SE)
    const driftKm = timelineHour * 1.852 * 1.0; // 1 knot speed
    const latOffset = (driftKm / 111.0) * -0.56;
    const lonOffset = (driftKm / (111.0 * Math.cos(centerLat * Math.PI / 180))) * 0.83;
    activeSlickLat = centerLat + latOffset;
    activeSlickLon = centerLon + lonOffset;
  }

  // Dynamic responder position calculation
  let responderLat = responderRoute?.waypoints?.[0]?.lat || 18.9438;
  let responderLon = responderRoute?.waypoints?.[0]?.lon || 72.8360;

  if (timelineHour > 0 && responderRoute?.waypoints) {
    const totalWps = responderRoute.waypoints.length;
    const progress = Math.min(timelineHour / 4.1, 1.0);
    const index = Math.min(Math.floor(progress * (totalWps - 1)), totalWps - 2);
    const wp1 = responderRoute.waypoints[index];
    const wp2 = responderRoute.waypoints[index + 1] || wp1;
    const subProgress = progress * (totalWps - 1) - index;

    responderLat = wp1.lat + (wp2.lat - wp1.lat) * subProgress;
    responderLon = wp1.lon + (wp2.lon - wp1.lon) * subProgress;
  }

  const polylineCoords: [number, number][] = hindcastTrajectory.map((pt) => [pt.lat, pt.lon]);

  return (
    <div className="w-full h-full min-h-[460px] relative border-2 border-concrete-700 bg-concrete-950 font-mono select-none overflow-hidden">
      {/* Corner Architectural Crosshairs */}
      <div className="absolute top-2 left-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        ┌─ [NW 19.80°N / 70.80°E]
      </div>
      <div className="absolute top-2 right-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        [NE 19.80°N / 73.20°E] ─┐
      </div>
      <div className="absolute bottom-10 left-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        └─ [SW 18.60°N / 70.80°E]
      </div>
      <div className="absolute bottom-10 right-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        [SE 18.60°N / 73.20°E] ─┘
      </div>

      {/* Top Banner Displaying Active Operational Timeline Mode */}
      <div className="absolute top-3 left-16 right-16 z-[400] flex items-center justify-center pointer-events-none">
        <div
          className={`px-4 py-1.5 border-2 text-xs font-mono font-black tracking-wider uppercase shadow-[4px_4px_0px_#08090c] ${
            timelineHour < 0
              ? 'bg-concrete-900 text-safety-orange border-safety-orange'
              : timelineHour > 0
              ? 'bg-concrete-900 text-sky-400 border-sky-400'
              : 'bg-concrete-900 text-concrete-100 border-concrete-600'
          }`}
        >
          <span className="mr-2">■</span>
          <span>
            {timelineHour < 0
              ? `HINDCAST MODE // T ${timelineHour}.0H — RECONSTRUCTED PROBABLE ORIGIN (±3.5 KM)`
              : timelineHour > 0
              ? `FORECAST MODE // T +${timelineHour}.0H — FORWARD IMPACT CONE & INTERCEPT`
              : `ACQUISITION OVERPASS // T0 — SENTINEL-1 C-SAR OBSERVED SLICK`}
          </span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLon]}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px]"
      >
        {/* Esri Dark Gray Canvas Basemap */}
        <TileLayer
          attribution='&copy; Esri, HERE, Garmin, METI/NASA, USGS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* 2D Drift Expansion Cone Polygon */}
        {activeLayers?.drift_cone !== false && driftConePolygon && driftConePolygon.length > 2 && (
          <Polygon
            positions={driftConePolygon as [number, number][]}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: timelineHour > 0 ? 0.22 : 0.08,
              weight: timelineHour > 0 ? 2 : 1,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border border-concrete-700">
                <div className="bg-sky-950 text-sky-400 font-bold px-2 py-1 mb-2 border border-sky-500/30">
                  ▲ 2D DRIFT EXPANSION CONE
                </div>
                <div className="space-y-1 text-[11px] text-concrete-300">
                  <p>Turbulent Spread Parameter: 35° Angular Cone</p>
                  <p>Advective Current: 1.2 kts @ 065° True</p>
                  <p className="text-safety-orange font-bold">Landfall Target: Raigad Estuary Corridor</p>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Dynamic Oil Spill Polygon / Circle */}
        {activeLayers?.slick_mask !== false && (
          <Circle
            center={[activeSlickLat, activeSlickLon]}
            radius={3500 + Math.abs(timelineHour) * 280}
            pathOptions={{
              color: timelineHour < 0 ? '#ff5500' : '#ef4444',
              fillColor: timelineHour < 0 ? '#ff5500' : '#ef4444',
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border-2 border-safety-orange">
                <div className="bg-safety-orange text-concrete-950 font-black px-2 py-1 mb-2 text-center uppercase tracking-wider">
                  {timelineHour < 0 ? 'RECONSTRUCTED RELEASE POINT' : 'OBSERVED SLICK CENTROID'}
                </div>
                <div className="space-y-1 text-[11px] text-concrete-300">
                  <p>STATUS: <strong className="text-concrete-100">MODEL-DERIVED</strong></p>
                  <p>COORDINATES: {activeSlickLat.toFixed(4)}° N, {activeSlickLon.toFixed(4)}° E</p>
                  <p>TIME HORIZON: T {timelineHour >= 0 ? `+${timelineHour}` : timelineHour}.0H</p>
                  <p className="text-safety-orange font-bold">
                    {timelineHour < 0 ? 'SENSITIVITY ENVELOPE: ±3.5 KM' : `AREA: ${slickAreaKm2.toFixed(1)} KM² | VOL: ${slickVolumeM3.toFixed(1)} M³`}
                  </p>
                </div>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Backward Hindcast Drift Trajectory Polyline */}
        {activeLayers?.drift_cone !== false && polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#ff5500',
              weight: 2.5,
              dashArray: '6, 6',
              opacity: 0.9,
            }}
          />
        )}

        {/* Coast Guard Intercept Vector Line */}
        {activeLayers?.responder_intercept !== false && responderRoute?.waypoints && (
          <Polyline
            positions={responderRoute.waypoints.map((wp: any) => [wp.lat, wp.lon])}
            pathOptions={{
              color: '#10b981',
              weight: 2,
              dashArray: '4, 4',
              opacity: 0.9,
            }}
          />
        )}

        {/* Dynamic Coast Guard Responder Vessel Marker */}
        {activeLayers?.responder_intercept !== false && responderRoute && (
          <Circle
            center={[responderLat, responderLon]}
            radius={1800}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border border-emerald-500">
                <div className="bg-emerald-950 text-emerald-300 font-bold px-2 py-1 mb-2 border border-emerald-500/30">
                  ⚓ ICG POLLUTION CONTROL VESSEL
                </div>
                <div className="space-y-1 text-[11px] text-concrete-300">
                  <p>ASSET: Coast Guard Demonstration Unit</p>
                  <p>TRANSIT SPEED: 22.0 knots</p>
                  <p className="text-emerald-400 font-bold">EST. GEODESIC ETA: T+4.1H (~246 MINS)</p>
                  <p>ACTION: 2,000M Containment Boom Deployment</p>
                </div>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Dark Vessel Radar Targets */}
        {activeLayers?.dark_vessels !== false &&
          darkVessels.map((dv: any) => (
            <Circle
              key={dv.dark_target_id}
              center={[dv.lat, dv.lon]}
              radius={1400}
              eventHandlers={{
                click: () =>
                  onSelectVessel &&
                  onSelectVessel({
                    vessel_id: dv.dark_target_id,
                    vessel_name: dv.dark_target_id,
                    vessel_type: 'AIS-Unmatched Target (CFAR Radar)',
                    flag: 'UNVERIFIED',
                    mmsi: 'BLACKOUT',
                    cpa_dist_km: dv.cpa_dist_km,
                    distance_km: dv.cpa_dist_km,
                    attribution_score_pct: dv.risk_index_pct,
                    risk_level: 'HIGH RISK',
                  }),
              }}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border-2 border-amber-500">
                  <div className="bg-amber-950 text-amber-300 font-bold px-2 py-1 mb-2 border border-amber-500/30 flex items-center justify-between">
                    <span>👁 {dv.dark_target_id}</span>
                    <span className="text-[10px]">CFAR TARGET</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-concrete-300 mb-2">
                    <p>STATUS: <strong className="text-amber-400">AIS-UNMATCHED TARGET</strong></p>
                    <p>SAR BACKSCATTER PEAK: {dv.rcs_db} dB (or {dv.rcs_db} dBsm)</p>
                    <p>CPA DISTANCE TO SLICK: {dv.cpa_dist_km} km</p>
                    <p className="text-amber-400 font-bold">PRIORITY: 88.2 (DEMO VALUE)</p>
                  </div>
                  <button
                    onClick={() =>
                      onSelectVessel &&
                      onSelectVessel({
                        vessel_id: dv.dark_target_id,
                        vessel_name: dv.dark_target_id,
                        vessel_type: 'AIS-Unmatched Target (CFAR Radar)',
                        flag: 'UNVERIFIED',
                        mmsi: 'BLACKOUT',
                        cpa_dist_km: dv.cpa_dist_km,
                        distance_km: dv.cpa_dist_km,
                        attribution_score_pct: dv.risk_index_pct,
                        risk_level: 'HIGH RISK',
                      })
                    }
                    className="brutalist-btn w-full py-1.5 bg-concrete-800 text-amber-300 font-bold text-[10px] text-center uppercase"
                  >
                    [ AUDIT RADAR TARGET → ]
                  </button>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* Reconstructed Release Point & Sensitivity Envelope Boundary */}
        {reconstructedRelease && (
          <>
            {/* ±3.5 km Sensitivity Envelope Circle */}
            <Circle
              center={[reconstructedRelease.lat, reconstructedRelease.lon]}
              radius={3500}
              pathOptions={{
                color: '#ff5500',
                fillColor: '#ff5500',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            >
              <Popup>
                <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border border-safety-orange">
                  <div className="bg-safety-orange text-concrete-950 font-bold px-2 py-1 mb-2 uppercase">
                    HINDCAST SENSITIVITY ENVELOPE
                  </div>
                  <div className="space-y-1 text-[11px] text-concrete-300">
                    <p>BOUND: ±3.5 KM Empirical Sensitivity Envelope</p>
                    <p>JUSTIFICATION: Validated under ±20% Wind/Current Perturbations</p>
                    <p className="text-concrete-400">Max Origin Displacement: 3.18 km</p>
                  </div>
                </div>
              </Popup>
            </Circle>

            {/* Estimated Origin Locus Marker */}
            <Circle
              center={[reconstructedRelease.lat, reconstructedRelease.lon]}
              radius={1200}
              pathOptions={{
                color: '#ff5500',
                fillColor: '#ff5500',
                fillOpacity: timelineHour <= -6 ? 0.9 : 0.45,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border border-concrete-700">
                  <div className="bg-concrete-800 text-concrete-100 font-bold px-2 py-1 mb-2">
                    PROBABLE RELEASE LOCUS
                  </div>
                  <div className="space-y-1 text-[11px] text-concrete-300">
                    <p>RECONSTRUCTED: T -6.5H Prior ({reconstructedRelease.hours_ago} hrs)</p>
                    <p>COORDINATES: {reconstructedRelease.lat}° N, {reconstructedRelease.lon}° E</p>
                    <p className="text-safety-orange font-bold">27 Trajectory Waypoints</p>
                  </div>
                </div>
              </Popup>
            </Circle>
          </>
        )}

        {/* Candidate AIS Vessel Markers & Track Lines */}
        {activeLayers?.ais_tracks !== false &&
          suspects.map((vessel: any) => {
            if (!vessel.track_points || vessel.track_points.length === 0) return null;
            const trackCoords: [number, number][] = vessel.track_points.map((pt: any) => [
              pt.lat,
              pt.lon,
            ]);
            const isSelected =
              selectedVessel &&
              (selectedVessel.vessel_id === vessel.vessel_id ||
                selectedVessel.vessel_name === vessel.vessel_name);
            const isPrimary =
              vessel.attribution_score_pct >= 80.0 || vessel.risk_level === 'PRIMARY SUSPECT';

            // Dynamic vessel position along track based on timelineHour
            let vLat = vessel.lat;
            let vLon = vessel.lon;

            if (timelineHour < 0) {
              const trackStep = Math.max(
                0,
                Math.min(vessel.track_points.length - 1, Math.floor(6 + timelineHour))
              );
              vLat = vessel.track_points[trackStep]?.lat || vessel.lat;
              vLon = vessel.track_points[trackStep]?.lon || vessel.lon;
            }

            return (
              <React.Fragment key={vessel.vessel_id || vessel.id}>
                {/* Vessel Track Polyline */}
                <Polyline
                  positions={trackCoords}
                  pathOptions={{
                    color: isSelected ? '#ff5500' : isPrimary ? '#ff5500' : '#4b5563',
                    weight: isSelected ? 4 : isPrimary ? 2.5 : 1.5,
                    dashArray: isSelected ? undefined : isPrimary ? '4, 4' : '2, 4',
                    opacity: isSelected ? 1.0 : isPrimary ? 0.95 : 0.4,
                  }}
                />

                {/* Vessel Marker Ring */}
                <Circle
                  center={[vLat, vLon]}
                  radius={isSelected ? 2000 : 1300}
                  eventHandlers={{
                    click: () => onSelectVessel && onSelectVessel(vessel),
                  }}
                  pathOptions={{
                    color: isSelected ? '#ff5500' : isPrimary ? '#ff5500' : '#4b5563',
                    fillColor: isSelected ? '#ff5500' : isPrimary ? '#ff5500' : '#262c37',
                    fillOpacity: isSelected ? 1.0 : isPrimary ? 0.85 : 0.45,
                    weight: isSelected ? 3 : isPrimary ? 2 : 1,
                  }}
                >
                  <Popup>
                    <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border-2 border-concrete-700 min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-concrete-800 pb-1.5 mb-2">
                        <div>
                          <h3 className={`font-black uppercase ${isPrimary ? 'text-safety-orange' : 'text-concrete-200'}`}>
                            {vessel.vessel_name}
                          </h3>
                          <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                            SYNTHETIC DEMO
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-concrete-500">PRIORITY</span>
                          <div className="font-extrabold text-safety-orange text-sm">
                            {vessel.attribution_score_pct || 85}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-concrete-300 mb-2">
                        <p>TYPE: {vessel.vessel_type || 'Tanker'} • FLAG: {vessel.flag || 'PANAMA'}</p>
                        <p>MMSI: {vessel.mmsi || 'SYN-41901'}</p>
                        <p>CPA DISTANCE: {vessel.distance_km || vessel.cpa_dist_km || 1.8} km</p>
                        <p className="text-concrete-400">POSITION T {timelineHour}H: ({vLat.toFixed(4)}° N, {vLon.toFixed(4)}° E)</p>
                      </div>

                      <button
                        onClick={() => onSelectVessel && onSelectVessel(vessel)}
                        className="brutalist-btn-orange w-full py-1.5 font-bold text-[10px] text-center uppercase"
                      >
                        [ AUDIT CANDIDATE ATTRIBUTION → ]
                      </button>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}
      </MapContainer>

      {/* Bottom Map Status & Cursor Coordinates Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-concrete-950/95 border-t-2 border-concrete-700 px-4 py-2 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono text-concrete-300">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 border border-concrete-700 text-safety-orange px-2 py-0.5 text-[10px] font-bold">
            [GEO LOCK]
          </span>
          <span className="text-concrete-400">
            VIEWPORT LOCUS:{' '}
            <strong className="text-concrete-100">
              {activeSlickLat.toFixed(4)}° N, {activeSlickLon.toFixed(4)}° E
            </strong>
          </span>
          <span className="text-concrete-600 hidden md:inline">•</span>
          <span className="text-concrete-400 hidden md:inline">
            GRID RESOLUTION: <strong className="text-concrete-100">2.0 NM (3.7 KM)</strong>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-safety-orange font-bold flex items-center space-x-1">
            <span>■</span>
            <span>SPILL ORIGIN</span>
          </span>
          <span className="text-concrete-400 font-bold">
            CHRONO: T {timelineHour >= 0 ? `+${timelineHour}` : timelineHour}.0H
          </span>
          <span className="border border-concrete-700 px-2 py-0.5 bg-concrete-900 text-concrete-200 text-[11px] font-bold hidden sm:inline">
            {selectedVessel
              ? `AUDITING: ${selectedVessel.vessel_name}`
              : 'LEAD: MT OCEAN PIONEER [SYNTHETIC DEMO]'}
          </span>
        </div>
      </div>
    </div>
  );
}
