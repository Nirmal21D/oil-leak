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
  onSelectVessel
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
      <div className="w-full h-full flex items-center justify-center bg-[#111622] rounded-xl border border-[#232d45]">
        <div className="text-center space-y-2">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Loading Map Viewport...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic interpolated slick position based on timelineHour (-6 to +8)
  const originLat = reconstructedRelease?.lat || 19.473;
  const originLon = reconstructedRelease?.lon || 71.209;

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
    const subProgress = (progress * (totalWps - 1)) - index;

    responderLat = wp1.lat + (wp2.lat - wp1.lat) * subProgress;
    responderLon = wp1.lon + (wp2.lon - wp1.lon) * subProgress;
  }

  const polylineCoords: [number, number][] = hindcastTrajectory.map(pt => [pt.lat, pt.lon]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[#232d45] bg-[#0f1420]">
      {/* Top Banner Displaying Active Timeline Mode */}
      <div className="absolute top-3 left-12 right-12 z-[400] flex items-center justify-center pointer-events-none">
        <div className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold shadow-lg backdrop-blur flex items-center space-x-2 ${
          timelineHour < 0
            ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
            : timelineHour > 0
            ? 'bg-sky-950/90 text-sky-300 border-sky-500/40'
            : 'bg-[#111622]/90 text-slate-200 border-[#232d45]'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          <span>
            {timelineHour < 0
              ? `HINDCAST MODE (T ${timelineHour}.0h) — SLICK REWOUND TO RELEASE ORIGIN LOCUS`
              : timelineHour > 0
              ? `FORECAST MODE (T +${timelineHour}.0h) — DRIFT PROPAGATION & COAST GUARD INTERCEPT`
              : `DETECTION MODE (T0) — SENTINEL-1 SAR PASS SENSING`}
          </span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLon]}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[500px]"
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
              fillOpacity: timelineHour > 0 ? 0.25 : 0.12,
              weight: timelineHour > 0 ? 2 : 1.5,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="p-1 text-slate-100 font-mono text-xs">
                <h3 className="font-bold text-sky-400 border-b border-slate-800 pb-1 mb-1">DRIFT EXPANSION CONE</h3>
                <p className="text-slate-300">Spill Dispersion: 35° Spread (Turbulent Spreading Parameter)</p>
                <p className="text-slate-400">Tidal M2 Oscillation Boundary</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Dynamic Detections Slick Zone (Controlled by activeLayers.slick_mask) */}
        {activeLayers?.slick_mask !== false && (
          <Circle
            center={[activeSlickLat, activeSlickLon]}
            radius={3500 + Math.abs(timelineHour) * 300}
            pathOptions={{
              color: timelineHour < 0 ? '#f59e0b' : '#ef4444',
              fillColor: timelineHour < 0 ? '#f59e0b' : '#ef4444',
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="p-1 text-slate-100 font-mono text-xs">
                <h3 className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1">
                  {timelineHour < 0 ? 'RECONSTRUCTED RELEASE LOCUS' : 'DYNAMIC SLICK POSITION'}
                </h3>
                <p className="text-slate-300">
                  {timelineHour < 0 ? '±3.5 km Sensitivity Envelope' : `Timeline Hour: T ${timelineHour >= 0 ? `+${timelineHour}` : timelineHour}h`}
                </p>
                <p className="text-slate-300 font-semibold">Coords: {activeSlickLat.toFixed(4)}° N, {activeSlickLon.toFixed(4)}° E</p>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Backward Hindcast Drift Trajectory Polyline */}
        {activeLayers?.drift_cone !== false && polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              dashArray: '6, 6',
              opacity: 0.95
            }}
          />
        )}

        {/* Coast Guard Intercept Vector Line */}
        {activeLayers?.responder_intercept !== false && responderRoute?.waypoints && (
          <Polyline
            positions={responderRoute.waypoints.map((wp: any) => [wp.lat, wp.lon])}
            pathOptions={{
              color: '#10b981',
              weight: 2.5,
              dashArray: '4, 4',
              opacity: 0.95
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
              weight: 2
            }}
          >
            <Popup>
              <div className="p-1 text-slate-100 font-mono text-xs">
                <h3 className="font-bold text-emerald-400 border-b border-slate-800 pb-1 mb-1">⚓ ICG POLLUTION CONTROL VESSEL</h3>
                <p className="text-slate-300">Transit Speed: 22.0 knots</p>
                <p className="text-slate-300">Current Position: ({responderLat.toFixed(4)}° N, {responderLon.toFixed(4)}° E)</p>
                <p className="text-emerald-400 font-bold">Estimated Geodesic ETA: T+4.1h</p>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Dark Vessel Radar Targets */}
        {activeLayers?.dark_vessels !== false && darkVessels.map((dv: any) => (
          <Circle
            key={dv.dark_target_id}
            center={[dv.lat, dv.lon]}
            radius={1400}
            eventHandlers={{
              click: () => onSelectVessel && onSelectVessel({
                vessel_id: dv.dark_target_id,
                vessel_name: dv.dark_target_id,
                vessel_type: 'Dark Vessel (SAR CFAR)',
                flag: 'UNVERIFIED',
                mmsi: 'BLACKOUT',
                cpa_dist_km: dv.cpa_dist_km,
                distance_km: dv.cpa_dist_km,
                attribution_score_pct: dv.risk_index_pct,
                risk_level: 'HIGH RISK'
              })
            }}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.75,
              weight: 1.5
            }}
          >
            <Popup>
              <div className="p-1 text-slate-100 font-mono text-xs space-y-1">
                <h3 className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1">👁 {dv.dark_target_id} (DARK TARGET)</h3>
                <p className="text-slate-300">SAR Backscatter Peak: {dv.rcs_db} dB</p>
                <p className="text-red-400 font-bold">AIS: BLACKOUT / UNVERIFIED</p>
                <p className="text-slate-400">Slick CPA: {dv.cpa_dist_km} km</p>
                <button
                  onClick={() => onSelectVessel && onSelectVessel({
                    vessel_id: dv.dark_target_id,
                    vessel_name: dv.dark_target_id,
                    vessel_type: 'Dark Vessel (SAR CFAR)',
                    flag: 'UNVERIFIED',
                    mmsi: 'BLACKOUT',
                    cpa_dist_km: dv.cpa_dist_km,
                    distance_km: dv.cpa_dist_km,
                    attribution_score_pct: dv.risk_index_pct,
                    risk_level: 'HIGH RISK'
                  })}
                  className="mt-1 w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded"
                >
                  AUDIT DARK TARGET
                </button>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Reconstructed Release Point Marker & Spatial Uncertainty Boundary */}
        {reconstructedRelease && (
          <>
            {/* Spatial Uncertainty Ellipse / Radius (±3.5 km) */}
            <Circle
              center={[reconstructedRelease.lat, reconstructedRelease.lon]}
              radius={3500}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6'
              }}
            >
              <Popup>
                <div className="p-1 text-slate-100 font-mono text-xs">
                  <h3 className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1">HINDCAST UNCERTAINTY BOUNDARY</h3>
                  <p className="text-slate-300">Spatial Confidence: ±3.5 km Radius</p>
                  <p className="text-slate-400">Accounts for ±10% current & windage turbulence</p>
                </div>
              </Popup>
            </Circle>

            {/* Estimated Origin Locus */}
            <Circle
              center={[reconstructedRelease.lat, reconstructedRelease.lon]}
              radius={1200}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: timelineHour <= -6 ? 0.9 : 0.45,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1 text-slate-100 font-mono text-xs">
                  <h3 className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-1">RECONSTRUCTED RELEASE LOCUS</h3>
                  <p className="text-slate-300">Estimated Release: {reconstructedRelease.hours_ago} hrs prior (T -6.5h)</p>
                  <p className="text-slate-400">Center: {reconstructedRelease.lat}° N, {reconstructedRelease.lon}° E</p>
                  <p className="text-amber-400 text-[10px] mt-1 font-semibold">Uncertainty Envelope: ±3.5 km (Gaussian σ)</p>
                </div>
              </Popup>
            </Circle>
          </>
        )}

        {/* Candidate AIS Vessel Markers & Track Lines */}
        {activeLayers?.ais_tracks !== false && suspects.map((vessel: any) => {
          if (!vessel.track_points || vessel.track_points.length === 0) return null;
          const trackCoords: [number, number][] = vessel.track_points.map((pt: any) => [pt.lat, pt.lon]);
          const isSelected = selectedVessel && (selectedVessel.vessel_id === vessel.vessel_id || selectedVessel.vessel_name === vessel.vessel_name);
          const isPrimary = vessel.attribution_score_pct >= 80.0 || vessel.risk_level === 'PRIMARY SUSPECT';

          // Dynamic vessel position along track based on timelineHour
          let vLat = vessel.lat;
          let vLon = vessel.lon;

          if (timelineHour < 0) {
            const trackStep = Math.max(0, Math.min(vessel.track_points.length - 1, Math.floor((6 + timelineHour))));
            vLat = vessel.track_points[trackStep]?.lat || vessel.lat;
            vLon = vessel.track_points[trackStep]?.lon || vessel.lon;
          }

          return (
            <React.Fragment key={vessel.vessel_id || vessel.id}>
              {/* Track Line */}
              <Polyline
                positions={trackCoords}
                pathOptions={{
                  color: isSelected ? '#38bdf8' : (isPrimary ? '#ef4444' : '#475569'),
                  weight: isSelected ? 4 : (isPrimary ? 3 : 1.5),
                  dashArray: isSelected ? undefined : (isPrimary ? '4, 4' : '2, 4'),
                  opacity: isSelected ? 1.0 : (isPrimary ? 0.95 : 0.4)
                }}
              />
              
              {/* Vessel Position Marker */}
              <Circle
                center={[vLat, vLon]}
                radius={isSelected ? 2000 : 1300}
                eventHandlers={{
                  click: () => onSelectVessel && onSelectVessel(vessel)
                }}
                pathOptions={{
                  color: isSelected ? '#38bdf8' : (isPrimary ? '#ef4444' : '#475569'),
                  fillColor: isSelected ? '#38bdf8' : (isPrimary ? '#ef4444' : '#334155'),
                  fillOpacity: isSelected ? 1.0 : (isPrimary ? 0.9 : 0.5),
                  weight: isSelected ? 3 : (isPrimary ? 2 : 1)
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-100 font-mono text-xs space-y-1">
                    <h3 className={`font-bold border-b border-slate-800 pb-1 mb-1 ${isPrimary ? 'text-red-400' : 'text-slate-300'}`}>
                      {vessel.vessel_name} ({vessel.vessel_id}) {isSelected ? '★ [AUDITING]' : ''}
                    </h3>
                    <p className="text-slate-300">Type: {vessel.vessel_type} • Flag: {vessel.flag}</p>
                    <p className="text-slate-100 font-extrabold">
                      MATCH SCORE: {vessel.attribution_score_pct || 85}%
                    </p>
                    <p className="text-slate-400">Position at T {timelineHour}h: ({vLat.toFixed(4)}° N, {vLon.toFixed(4)}° E)</p>
                    <button
                      onClick={() => onSelectVessel && onSelectVessel(vessel)}
                      className="mt-1 w-full py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] rounded"
                    >
                      AUDIT CANDIDATE VESSEL
                    </button>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Bottom Map Locus Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-[#111622]/95 backdrop-blur border-t border-[#232d45] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-bold border border-sky-500/30 text-[10px]">
            [LOCK LOCUS]
          </span>
          <span className="text-slate-400">CURSOR: <strong className="text-slate-200">{activeSlickLat.toFixed(4)}° N, {activeSlickLon.toFixed(4)}° E</strong></span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">SCALE: <strong className="text-slate-200">2.0 NM (3.7 km)</strong></span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-red-400 font-medium">■ DYNAMIC SPILL CENTER</span>
          <span className="text-sky-400">▲ STEP: T {timelineHour >= 0 ? `+${timelineHour}` : timelineHour}h</span>
          <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 font-bold border border-red-500/30 text-[10px]">
            {selectedVessel ? `SELECTED: ${selectedVessel.vessel_name}` : 'TOP LEAD: MT OCEAN PIONEER (SYN-AIS-9482)'}
          </span>
        </div>
      </div>
    </div>
  );
}
