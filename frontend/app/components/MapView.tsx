'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { formatCoordinate, formatCoordinateShort } from '../utils/geo';

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
  sceneBounds?: [[number, number], [number, number]];
  detectedPolygons?: number[][][];
  isGeoreferenced?: boolean;
  georeferenceStatus?: string;
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
  telemetry?: any;
}

export default function MapView({
  centerLat,
  centerLon,
  sceneBounds,
  detectedPolygons = [],
  isGeoreferenced = true,
  georeferenceStatus,
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
  slickAreaKm2,
  slickVolumeM3,
  telemetry,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

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

  // Step 5: Dynamic recentering controller via Leaflet map instance
  useEffect(() => {
    if (!mapInstance) return;
    if (sceneBounds && sceneBounds.length === 2 && sceneBounds[0] && sceneBounds[1]) {
      mapInstance.flyToBounds(sceneBounds, { padding: [40, 40], duration: 1.5 });
    } else if (centerLat && centerLon) {
      mapInstance.flyTo([centerLat, centerLon], 10, { duration: 1.5 });
    }
  }, [mapInstance, sceneBounds, centerLat, centerLon]);

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
  const hasCoordinates = centerLat != null && centerLon != null;
  const originLat = reconstructedRelease?.lat ?? centerLat;
  const originLon = reconstructedRelease?.lon ?? centerLon;

  let activeSlickLat = centerLat;
  let activeSlickLon = centerLon;

  if (hasCoordinates && timelineHour < 0 && originLat != null && originLon != null) {
    // Hindcast mode: interpolate between T0 center and T-6 release origin
    const ratio = Math.abs(timelineHour) / 6.0;
    const clampedRatio = Math.min(ratio, 1.0);
    activeSlickLat = centerLat + (originLat - centerLat) * clampedRatio;
    activeSlickLon = centerLon + (originLon - centerLon) * clampedRatio;
  } else if (hasCoordinates && timelineHour > 0) {
    // Forecast mode: project forward along heading ~124.3° (SE)
    const driftKm = timelineHour * 1.852 * 1.0; // 1 knot speed
    const latOffset = (driftKm / 111.0) * -0.56;
    const lonOffset = (driftKm / (111.0 * Math.cos(centerLat * Math.PI / 180))) * 0.83;
    activeSlickLat = centerLat + latOffset;
    activeSlickLon = centerLon + lonOffset;
  }

  // Dynamic responder position calculation
  let responderLat = responderRoute?.waypoints?.[0]?.lat ?? centerLat;
  let responderLon = responderRoute?.waypoints?.[0]?.lon ?? centerLon;

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

  // Derive dynamic bounding coordinates for corner crosshairs
  const nwCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[1][0], sceneBounds[0][1])
    : (centerLat != null && centerLon != null)
    ? formatCoordinateShort(centerLat + 0.4, centerLon - 0.4)
    : 'NW GRID';
  const neCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[1][0], sceneBounds[1][1])
    : (centerLat != null && centerLon != null)
    ? formatCoordinateShort(centerLat + 0.4, centerLon + 0.4)
    : 'NE GRID';
  const swCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[0][0], sceneBounds[0][1])
    : (centerLat != null && centerLon != null)
    ? formatCoordinateShort(centerLat - 0.4, centerLon - 0.4)
    : 'SW GRID';
  const seCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[0][0], sceneBounds[1][1])
    : (centerLat != null && centerLon != null)
    ? formatCoordinateShort(centerLat - 0.4, centerLon + 0.4)
    : 'SE GRID';

  return (
    <div className="w-full h-full min-h-[460px] relative border-2 border-concrete-700 bg-concrete-950 font-mono select-none overflow-hidden">
      {/* Corner Architectural Crosshairs */}
      <div className="absolute top-2 left-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        ┌─ [{nwCoord}]
      </div>
      <div className="absolute top-2 right-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        [{neCoord}] ─┐
      </div>
      <div className="absolute bottom-10 left-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        └─ [{swCoord}]
      </div>
      <div className="absolute bottom-10 right-2 z-[400] text-[10px] text-concrete-500 font-mono pointer-events-none">
        [{seCoord}] ─┘
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

      {/* Unreferenced Scene Notice Overlay */}
      {isGeoreferenced === false && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[450] bg-concrete-950/95 border-2 border-yellow-500/80 px-4 py-2 text-xs font-mono text-yellow-400 shadow-[4px_4px_0px_#000] flex items-center space-x-2 pointer-events-none">
          <span className="font-bold text-sm">⚠</span>
          <span>UNREFERENCED SCENE // GEODETIC METADATA ABSENT IN RASTER — MAP PROJECTION OMITTED</span>
        </div>
      )}

      <MapContainer
        ref={setMapInstance}
        center={[centerLat ?? 20.0, centerLon ?? 0.0]}
        zoom={hasCoordinates ? 9 : 3}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px]"
      >
        {/* Esri Dark Gray Canvas Basemap */}
        <TileLayer
          attribution='&copy; Esri, HERE, Garmin, METI/NASA, USGS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Sentinel-1 Real Scene Footprint Bounds Rectangle */}
        {sceneBounds && sceneBounds.length === 2 && (
          <Polygon
            positions={[
              [sceneBounds[0][0], sceneBounds[0][1]], // SW
              [sceneBounds[1][0], sceneBounds[0][1]], // NW
              [sceneBounds[1][0], sceneBounds[1][1]], // NE
              [sceneBounds[0][0], sceneBounds[1][1]], // SE
            ]}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '6, 6',
            }}
          >
            <Popup>
              <div className="p-2 bg-concrete-950 text-sky-400 font-mono text-[11px] border border-sky-500/40">
                <span className="font-bold">■ SENTINEL-1 SAR SCENE FOOTPRINT</span>
                <p className="text-[10px] text-concrete-300 mt-1">
                  SW: {formatCoordinate(sceneBounds[0][0], sceneBounds[0][1])}<br/>
                  NE: {formatCoordinate(sceneBounds[1][0], sceneBounds[1][1])}
                </p>
              </div>
            </Popup>
          </Polygon>
        )}

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
                  <p>Advective Current: {telemetry?.current || telemetry?.drift_vector || 'NOT AVAILABLE'}</p>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Real Detected Oil Spill Polygons (cv2.findContours -> GeoTIFF Affine Transform) */}
        {activeLayers?.slick_mask !== false && detectedPolygons && detectedPolygons.length > 0 && (
          detectedPolygons.map((polyCoords, idx) => (
            <Polygon
              key={`slick-contour-${idx}`}
              positions={polyCoords as [number, number][]}
              pathOptions={{
                color: timelineHour < 0 ? '#ff5500' : '#ef4444',
                fillColor: timelineHour < 0 ? '#ff5500' : '#ef4444',
                fillOpacity: 0.45,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border-2 border-safety-orange">
                  <div className="bg-safety-orange text-concrete-950 font-black px-2 py-1 mb-2 text-center uppercase tracking-wider">
                    REAL DETECTED OIL SLICK #{idx + 1}
                  </div>
                  <div className="space-y-1 text-[11px] text-concrete-300">
                    <p>STATUS: <strong className="text-concrete-100">U-NET SEGMENTATION CONTOUR</strong></p>
                    <p>VERTICES: {polyCoords.length} WGS-84 POINTS</p>
                    <p className="text-safety-orange font-bold">
                      {slickAreaKm2 ? `DERIVED AREA: ${slickAreaKm2.toFixed(2)} KM²` : 'METRIC AREA NOT RELIABLY DERIVED'}
                    </p>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))
        )}

        {/* Observed Slick Centroid Crosshair Marker */}
        {activeLayers?.spill_centroid !== false && isGeoreferenced && (slickAreaKm2 ?? 0) > 0 && activeSlickLat != null && activeSlickLon != null && (
          <Circle
            center={[activeSlickLat, activeSlickLon]}
            radius={250}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2 bg-concrete-900 text-concrete-100 font-mono text-xs border border-concrete-700">
                <p className="font-bold text-safety-orange">▲ OBSERVED SLICK CENTROID (T0)</p>
                <p className="text-[11px] text-concrete-300">
                  {formatCoordinate(activeSlickLat, activeSlickLon)}
                </p>
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

        {/* Geodesic Reference Vector (Dashed Amber) */}
        {activeLayers?.responder_intercept !== false && (responderRoute?.geodesic_reference_vector || responderRoute?.waypoints) && (
          <Polyline
            positions={(responderRoute.geodesic_reference_vector || responderRoute.waypoints).map((wp: any) => [wp.lat, wp.lon])}
            pathOptions={{
              color: '#f59e0b',
              weight: 2,
              dashArray: '6, 6',
              opacity: 0.85,
            }}
          />
        )}

        {/* Real Navigable Waterway Route (Solid Emerald, when available) */}
        {activeLayers?.responder_intercept !== false && responderRoute?.navigable_route_geometry?.length > 0 && (
          <Polyline
            positions={responderRoute.navigable_route_geometry.map((wp: any) => [wp.lat, wp.lon])}
            pathOptions={{
              color: '#10b981',
              weight: 3,
              opacity: 0.95,
            }}
          />
        )}

        {/* WPI Candidate Discovery Ports (Grey Circles) */}
        {activeLayers?.responder_intercept !== false && responderRoute?.candidate_audit?.candidates && (
          responderRoute.candidate_audit.candidates
            .filter((c: any) => !c.is_selected)
            .map((c: any) => (
              <Circle
                key={c.wpi_number}
                center={[c.lat, c.lon]}
                radius={1200}
                pathOptions={{
                  color: '#6b7280',
                  fillColor: '#4b5563',
                  fillOpacity: 0.6,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="p-2 bg-concrete-900 text-concrete-100 font-mono text-xs border border-concrete-700">
                    <span className="text-[9px] text-concrete-400 block uppercase font-bold">WPI CANDIDATE PORT</span>
                    <strong className="text-concrete-100">{c.main_port_name || c.port_name}</strong>
                    <p className="text-[10px] text-sky-400">NGA WPI #{c.wpi_number} ({c.unlocode})</p>
                    <p className="text-[10px] text-concrete-300">Geodesic Dist: {c.distance_km} km ({c.bearing_deg}° T)</p>
                  </div>
                </Popup>
              </Circle>
            ))
        )}

        {/* Selected WPI Candidate Port Marker */}
        {activeLayers?.responder_intercept !== false && responderRoute && responderLat != null && responderLon != null && (
          <Circle
            center={[responderLat, responderLon]}
            radius={2000}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-3 bg-concrete-900 text-concrete-100 font-mono text-xs border border-amber-500 min-w-[250px]">
                <div className="bg-amber-950 text-amber-300 font-bold px-2 py-1 mb-2 border border-amber-500/30 flex items-center justify-between">
                  <span>★ SELECTED WPI CANDIDATE</span>
                  <span className="text-[9px] text-sky-300">{responderRoute.source || 'NGA WPI'}</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-concrete-300">
                  <div>
                    <span className="text-[9px] text-concrete-400 block uppercase font-mono">PORT CANDIDATE:</span>
                    <strong className="text-concrete-100 text-xs">{responderRoute.response_hub || responderRoute.station_base || 'NOT IDENTIFIED'}</strong>
                  </div>
                  <p className="text-[10px] text-sky-400">REGISTRY: NGA WPI #{responderRoute.wpi_number || '—'} ({responderRoute.un_locode || responderRoute.unlocode || '—'})</p>
                  <p>GEODESIC DISTANCE: {responderRoute.geodesic_distance_km ?? responderRoute.distance_km ?? '—'} km ({responderRoute.bearing_deg || 0.0}° T)</p>
                  <p className="text-amber-400 font-bold">ROUTING STATUS: {responderRoute.routing_status || 'GEODESIC_FALLBACK'}</p>
                  <p className="text-concrete-400">SELECTION BASIS: {responderRoute.selection_basis || 'Minimum geodesic distance'}</p>
                  <p className="text-concrete-400">NAVIGABLE DISTANCE: {responderRoute.navigable_distance_km ? `${responderRoute.navigable_distance_km} km` : 'NOT ESTABLISHED'}</p>
                  <p className="text-concrete-400">OPERATIONAL ETA: {responderRoute.operational_eta_formatted || 'NOT ESTABLISHED'}</p>
                  <p className="text-[9px] text-concrete-500 italic pt-1 border-t border-concrete-800">
                    * Straight-line distance; navigable water route and operational ETA not established.
                  </p>
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
                    <p className="text-amber-400 font-bold">PRIORITY: {dv.risk_index_pct ?? '—'} (DEMO VALUE)</p>
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
                    <p>RECONSTRUCTED: T -{reconstructedRelease.hours_ago ?? 6.5}H Prior ({reconstructedRelease.hours_ago ?? '—'} hrs)</p>
                    <p>COORDINATES: {formatCoordinate(reconstructedRelease.lat, reconstructedRelease.lon)}</p>
                    <p className="text-safety-orange font-bold">{hindcastTrajectory?.length || 0} Trajectory Waypoints</p>
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
                          <span className={`stamp-tag text-[9px] ${
                            vessel.is_historical_real
                              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/40'
                              : 'border-concrete-700 text-concrete-400'
                          }`}>
                            {vessel.is_historical_real ? 'REAL NOAA AIS' : 'SYNTHETIC DEMO'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-concrete-500">PRIORITY</span>
                          <div className="font-extrabold text-safety-orange text-sm">
                            {vessel.attribution_score_pct !== undefined ? `${vessel.attribution_score_pct}%` : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-concrete-300 mb-2">
                        <p>TYPE: {vessel.vessel_type || 'UNSPECIFIED'} • FLAG: {vessel.flag || 'UNKNOWN'}</p>
                        <p>MMSI: {vessel.mmsi || 'NO MMSI'}</p>
                        <p>CPA DISTANCE: {vessel.distance_km ?? vessel.cpa_dist_km ?? '—'} km</p>
                        <p className="text-concrete-400">POSITION T {timelineHour}H: ({formatCoordinate(vLat, vLon)})</p>
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

      {/* Permanent Unified Tactical Map Legend */}
      <div className="absolute bottom-11 left-3 z-[400] bg-tactical-navy/95 border border-tactical-border p-2 font-mono text-[9px] text-tactical-text space-y-1 shadow-lg pointer-events-auto max-w-[260px]">
        <div className="text-[8px] font-black uppercase tracking-widest text-tactical-dim border-b border-tactical-border/80 pb-1 flex items-center justify-between">
          <span className="text-tactical-text font-bold">TACTICAL MAP LEGEND</span>
          <span className="text-tactical-dim">NTRO PS-26143</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5"><span className="text-tactical-amber font-bold text-xs">▰</span><span>Observed Slick</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-red font-bold text-xs">◆</span><span>Dark Radar Contact</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-text font-bold text-xs">●</span><span>AIS Vessel</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-amber font-bold text-xs">◉</span><span>Primary Attribution Lead</span></div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5"><span className="text-tactical-cyan font-bold text-xs">┄┄</span><span>Drift Hindcast</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-amber font-bold text-xs">◯</span><span>Release Locus</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-text font-bold text-xs">◇</span><span>WPI Port Candidate</span></div>
            <div className="flex items-center space-x-1.5"><span className="text-tactical-amber font-bold text-xs">★</span><span>Selected WPI Candidate</span></div>
          </div>
        </div>
        <div className="border-t border-tactical-border/80 pt-1 text-[8px] text-tactical-muted flex items-center justify-between font-mono">
          <span><strong className="text-tactical-slate">- - -</strong> Geodesic Reference</span>
          <span><strong className="text-tactical-green">━━━</strong> Validated Route</span>
        </div>
      </div>

      {/* Bottom Map Status & Cursor Coordinates Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-concrete-950/95 border-t-2 border-concrete-700 px-4 py-2 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono text-concrete-300">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 border border-concrete-700 text-safety-orange px-2 py-0.5 text-[10px] font-bold">
            [GEO LOCK]
          </span>
          <span className="text-concrete-400">
            VIEWPORT LOCUS:{' '}
            <strong className="text-concrete-100">
              {hasCoordinates ? formatCoordinate(activeSlickLat, activeSlickLon) : 'AWAITING SENSOR INGEST'}
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
              : suspects.length > 0
              ? `LEAD: ${suspects[0].vessel_name}`
              : 'STANDBY // MONITORING'}
          </span>
        </div>
      </div>
    </div>
  );
}
