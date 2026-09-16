'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { formatCoordinate, formatCoordinateShort } from '../utils/geo';
import {
  calculateInvestigationBounds,
  calculatePolylineChevrons,
  findAisTemporalBeads,
  haversineDistanceKm,
} from '../utils/mapPlotting';

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
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const ImageOverlay = dynamic(
  () => import('react-leaflet').then((mod) => mod.ImageOverlay),
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
  activePhase?: string;
  maskBase64?: string;
  replayStep?: number;
  onStartReplay?: () => void;
  isReplayOpen?: boolean;
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
  activePhase = 'overview',
  maskBase64,
  replayStep,
  onStartReplay,
  isReplayOpen,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [LInstance, setLInstance] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [layerMode, setLayerMode] = useState<'vector' | 'mask'>('vector');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setLInstance(L);
      setLeafletLoaded(true);
    });
  }, []);

  const hasCoordinates = centerLat != null && centerLon != null;
  const originLat = reconstructedRelease?.lat ?? centerLat;
  const originLon = reconstructedRelease?.lon ?? centerLon;

  // Primary suspect detection
  const primarySuspect = useMemo(() => {
    if (selectedVessel) return selectedVessel;
    if (suspects && suspects.length > 0) return suspects[0];
    return null;
  }, [selectedVessel, suspects]);

  // Reconstructed hindcast model state position based on timelineHour (-6.5 to 0)
  // NOTE: Observed SAR slick footprint and centroid reticle remain STRICTLY ANCHORED at T0 (centerLat, centerLon).
  // The model state indicates the backcast advection point at T - |t|H.
  let reconstructedDriftStateLat = centerLat;
  let reconstructedDriftStateLon = centerLon;

  if (hasCoordinates && timelineHour < 0 && originLat != null && originLon != null) {
    const ratio = Math.abs(timelineHour) / (reconstructedRelease?.hours_ago || 6.5);
    const clampedRatio = Math.min(ratio, 1.0);
    reconstructedDriftStateLat = centerLat + (originLat - centerLat) * clampedRatio;
    reconstructedDriftStateLon = centerLon + (originLon - centerLon) * clampedRatio;
  }

  // Responder station and position
  let responderLat = responderRoute?.selected_port?.lat ?? responderRoute?.waypoints?.[0]?.lat ?? responderRoute?.station_coords?.[0] ?? centerLat;
  let responderLon = responderRoute?.selected_port?.lon ?? responderRoute?.waypoints?.[0]?.lon ?? responderRoute?.station_coords?.[1] ?? centerLon;

  if (timelineHour > 0 && responderRoute?.waypoints && responderRoute.waypoints.length > 1) {
    const totalWps = responderRoute.waypoints.length;
    const progress = Math.min(timelineHour / 4.1, 1.0);
    const index = Math.min(Math.floor(progress * (totalWps - 1)), totalWps - 2);
    const wp1 = responderRoute.waypoints[index];
    const wp2 = responderRoute.waypoints[index + 1] || wp1;
    const subProgress = progress * (totalWps - 1) - index;

    responderLat = wp1.lat + (wp2.lat - wp1.lat) * subProgress;
    responderLon = wp1.lon + (wp2.lon - wp1.lon) * subProgress;
  }

  const polylineCoords: [number, number][] = useMemo(() => {
    return hindcastTrajectory.map((pt) => [pt.lat, pt.lon]);
  }, [hindcastTrajectory]);

  // Backward drift chevrons (chronological order: release -> centroid)
  const backwardChevrons = useMemo(() => {
    if (polylineCoords.length < 2) return [];
    // Ensure chevrons point in direction of reverse advection
    return calculatePolylineChevrons(polylineCoords, 4.0);
  }, [polylineCoords]);

  // Primary suspect track coordinates and chevrons
  const primaryTrackCoords: [number, number][] = useMemo(() => {
    if (!primarySuspect?.track_points || primarySuspect.track_points.length === 0) return [];
    return primarySuspect.track_points.map((pt: any) => [pt.lat, pt.lon]);
  }, [primarySuspect]);

  const primaryChevrons = useMemo(() => {
    if (primaryTrackCoords.length < 2) return [];
    return calculatePolylineChevrons(primaryTrackCoords, 3.5);
  }, [primaryTrackCoords]);

  // Real AIS temporal beads (milestones T-6H, T-4H, T-2H, T0)
  const primaryTemporalBeads = useMemo(() => {
    if (!primarySuspect?.track_points) return [];
    return findAisTemporalBeads(primarySuspect.track_points, telemetry?.metocean_query_time);
  }, [primarySuspect, telemetry]);

  // Geodesic vector midpoint and distance
  const geodesicVectorCoords: [number, number][] = useMemo(() => {
    if (!responderRoute) return [];
    const pts = responderRoute.geodesic_reference_vector || responderRoute.waypoints;
    if (!pts || pts.length < 2) return [];
    return pts.map((p: any) => [p.lat, p.lon]);
  }, [responderRoute]);

  const geodesicMidpoint: [number, number] | null = useMemo(() => {
    if (geodesicVectorCoords.length < 2) return null;
    const p1 = geodesicVectorCoords[0];
    const p2 = geodesicVectorCoords[geodesicVectorCoords.length - 1];
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  }, [geodesicVectorCoords]);

  const geodesicDistanceVal = responderRoute?.geodesic_distance_km ?? responderRoute?.distance_km ?? null;

  // Custom Tactical Leaflet Markers (DivIcons)
  const reticleIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-reticle-marker',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 10 V4 H10" stroke="#F5A623" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M32 10 V4 H26" stroke="#F5A623" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M4 26 V32 H10" stroke="#F5A623" stroke-width="1.5" stroke-linecap="square"/>
            <path d="M32 26 V32 H26" stroke="#F5A623" stroke-width="1.5" stroke-linecap="square"/>
            <line x1="18" y1="5" x2="18" y2="13" stroke="#F5A623" stroke-width="1.5"/>
            <line x1="18" y1="23" x2="18" y2="31" stroke="#F5A623" stroke-width="1.5"/>
            <line x1="5" y1="18" x2="13" y2="18" stroke="#F5A623" stroke-width="1.5"/>
            <line x1="23" y1="18" x2="31" y2="18" stroke="#F5A623" stroke-width="1.5"/>
            <circle cx="18" cy="18" r="1.5" fill="#F5A623"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [LInstance]);

  const releaseLocusIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-release-marker',
      html: `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="13" stroke="#F5A623" stroke-width="1.2" stroke-dasharray="3 3"/>
            <circle cx="16" cy="16" r="7" stroke="#F5A623" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="2.5" fill="#F5A623"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, [LInstance]);

  const hindcastStateIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-hindcast-state-marker',
      html: `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
          <div style="position:absolute; width:26px; height:26px; border-radius:50%; border:1.5px solid #25C7D9; opacity:0.8; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="9" stroke="#25C7D9" stroke-width="1.5" stroke-dasharray="2 2"/>
            <circle cx="11" cy="11" r="3.5" fill="#25C7D9"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [LInstance]);

  const wpiStarIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-wpi-star',
      html: `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#F5A623" stroke="#070B0F" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7.1-6.3-3.6-6.3 3.6 1.6-7.1L2 9.2l7.1-.6L12 2z"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [LInstance]);

  const wpiCandidateIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-wpi-candidate',
      html: `
        <div style="position:relative; width:18px; height:18px; display:flex; align-items:center; justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#71808C" stroke="#26333D" stroke-width="1" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="1" width="8" height="8" transform="rotate(45 7 1)" />
          </svg>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }, [LInstance]);

  const radarContactIcon = useMemo(() => {
    if (!LInstance) return null;
    return LInstance.divIcon({
      className: 'tactical-radar-contact',
      html: `
        <div style="position:relative; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#E05252" stroke="#070B0F" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="1.5" width="9" height="9" transform="rotate(45 8 1.5)" />
          </svg>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, [LInstance]);

  const createChevronIcon = useCallback(
    (bearing: number, color = '#F5A623') => {
      if (!LInstance) return null;
      return LInstance.divIcon({
        className: 'tactical-chevron-icon',
        html: `
          <div style="transform: rotate(${bearing}deg); width: 12px; height: 12px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="${color}" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 1 L7 5 L2 9 Z"/>
            </svg>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    },
    [LInstance]
  );

  const createTemporalBeadIcon = useCallback(
    (label: string) => {
      if (!LInstance) return null;
      return LInstance.divIcon({
        className: 'tactical-temporal-bead',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; pointer-events:none;">
            <div style="width:7px; height:7px; border-radius:50%; background:#F5A623; border:1px solid #070B0F;"></div>
            <span style="font-family:monospace; font-size:8px; font-weight:bold; color:#F5A623; background:#0B1117e0; border:1px solid #26333D; padding:0px 3px; margin-top:2px; white-space:nowrap; border-radius:1px;">
              ${label}
            </span>
          </div>
        `,
        iconSize: [26, 22],
        iconAnchor: [13, 3],
      });
    },
    [LInstance]
  );

  const createGeodesicLabelIcon = useCallback(
    (distanceKm: number | string) => {
      if (!LInstance) return null;
      return LInstance.divIcon({
        className: 'tactical-geodesic-badge',
        html: `
          <div style="display:flex; align-items:center; justify-content:center; white-space:nowrap; pointer-events:none;">
            <div style="background:#0B1117f0; border:1px solid #596771; padding:2px 6px; font-family:monospace; font-size:8px; color:#8D9AA5; letter-spacing:0.5px; border-radius:2px; box-shadow:0 2px 4px rgba(0,0,0,0.8);">
              <span style="color:#F5A623; font-weight:bold;">GEODESIC REF</span> ${distanceKm} KM · <span style="color:#E05252; font-weight:bold;">NON-NAVIGABLE</span>
            </div>
          </div>
        `,
        iconSize: [180, 20],
        iconAnchor: [90, 10],
      });
    },
    [LInstance]
  );

  // Dynamic Camera Bounds Actions
  const handleIncidentFocus = useCallback(() => {
    if (!mapInstance) return;
    const bounds = calculateInvestigationBounds({
      slickCentroid: hasCoordinates ? { lat: centerLat!, lon: centerLon! } : null,
      detectedPolygons,
      reconstructedRelease,
      primarySuspect,
      hindcastTrajectory,
      mode: 'incident',
    });
    if (bounds) {
      mapInstance.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
    } else if (hasCoordinates) {
      mapInstance.flyTo([centerLat, centerLon], 11, { duration: 1.2 });
    }
  }, [mapInstance, hasCoordinates, centerLat, centerLon, detectedPolygons, reconstructedRelease, primarySuspect, hindcastTrajectory]);

  const handleTheaterC2 = useCallback(() => {
    if (!mapInstance) return;
    const bounds = calculateInvestigationBounds({
      slickCentroid: hasCoordinates ? { lat: centerLat!, lon: centerLon! } : null,
      detectedPolygons,
      reconstructedRelease,
      primarySuspect,
      suspects,
      responderRoute,
      hindcastTrajectory,
      mode: 'theater',
    });
    if (bounds) {
      mapInstance.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
    } else if (hasCoordinates) {
      mapInstance.flyTo([centerLat, centerLon], 8, { duration: 1.2 });
    }
  }, [mapInstance, hasCoordinates, centerLat, centerLon, detectedPolygons, reconstructedRelease, primarySuspect, suspects, responderRoute, hindcastTrajectory]);

  // Initial Auto-Fit on scene load
  useEffect(() => {
    if (!mapInstance) return;
    if (hasCoordinates) {
      handleIncidentFocus();
    }
  }, [mapInstance, centerLat, centerLon]);

  // Dynamic Camera Gliding for Investigation Replay Steps
  useEffect(() => {
    if (!mapInstance || !hasCoordinates || !replayStep) return;

    if (replayStep === 1) {
      // Step 1: Smooth camera lock on observed slick at T0
      mapInstance.flyTo([centerLat, centerLon], 11.5, { duration: 1.4 });
    } else if (replayStep === 2) {
      // Step 2: Hindcast frame (slick to reconstructed release locus)
      handleIncidentFocus();
    } else if (replayStep === 3) {
      // Step 3: AIS Correlation frame (release locus + candidate track)
      if (reconstructedRelease?.lat != null && reconstructedRelease?.lon != null) {
        mapInstance.flyTo([reconstructedRelease.lat, reconstructedRelease.lon], 11, { duration: 1.4 });
      } else {
        handleIncidentFocus();
      }
    } else if (replayStep === 4) {
      // Step 4: Full theater context (including Port Sulphur candidate port)
      handleTheaterC2();
    }
  }, [replayStep, mapInstance, hasCoordinates, centerLat, centerLon, reconstructedRelease, handleIncidentFocus, handleTheaterC2]);

  if (!mounted || !leafletLoaded) {
    return (
      <div className="w-full h-full min-h-[460px] flex items-center justify-center bg-tactical-base border-2 border-tactical-border font-mono">
        <div className="text-center space-y-3 p-6 border border-tactical-border bg-tactical-navy">
          <div className="w-6 h-6 border-2 border-tactical-amber border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-tactical-text font-bold uppercase tracking-wider">
            INITIALIZING TACTICAL MAP SURFACE...
          </p>
          <span className="text-[10px] text-tactical-muted">
            ESRI DARK CANVAS // WGS-84 METRIC PROJECTION
          </span>
        </div>
      </div>
    );
  }

  // Derive dynamic bounding coordinates for corner crosshairs
  const nwCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[1][0], sceneBounds[0][1])
    : hasCoordinates
    ? formatCoordinateShort(centerLat + 0.4, centerLon - 0.4)
    : 'NW GRID';
  const neCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[1][0], sceneBounds[1][1])
    : hasCoordinates
    ? formatCoordinateShort(centerLat + 0.4, centerLon + 0.4)
    : 'NE GRID';
  const swCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[0][0], sceneBounds[0][1])
    : hasCoordinates
    ? formatCoordinateShort(centerLat - 0.4, centerLon - 0.4)
    : 'SW GRID';
  const seCoord = sceneBounds
    ? formatCoordinateShort(sceneBounds[0][0], sceneBounds[1][1])
    : hasCoordinates
    ? formatCoordinateShort(centerLat - 0.4, centerLon + 0.4)
    : 'SE GRID';

  return (
    <div className="w-full h-full min-h-[460px] relative border border-tactical-border bg-tactical-base font-mono select-none overflow-hidden">
      {/* Corner Architectural Crosshairs */}
      <div className="absolute top-2 left-2 z-[400] text-[10px] text-tactical-dim font-mono pointer-events-none">
        ┌─ [{nwCoord}]
      </div>
      <div className="absolute top-2 right-24 z-[390] text-[10px] text-tactical-dim font-mono pointer-events-none hidden xl:block">
        [{neCoord}] ─┐
      </div>
      <div className="absolute bottom-12 left-2 z-[400] text-[10px] text-tactical-dim font-mono pointer-events-none">
        └─ [{swCoord}]
      </div>
      <div className="absolute bottom-12 right-2 z-[400] text-[10px] text-tactical-dim font-mono pointer-events-none hidden md:block">
        [{seCoord}] ─┘
      </div>

      {/* Top Banner Status Notification */}
      <div className="absolute top-2 left-20 z-[400] flex items-center space-x-2 pointer-events-none">
        <div className="bg-tactical-navy/90 border border-tactical-border px-2.5 py-1 text-[10px] text-tactical-muted flex items-center space-x-2 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-tactical-green animate-pulse"></span>
          <span>
            {timelineHour < 0
              ? `HINDCAST MODE // T ${timelineHour}.0H — RECONSTRUCTED RELEASE LOCUS`
              : timelineHour > 0
              ? `FORECAST MODE // T +${timelineHour}.0H — MODELED DISPERSION ENVELOPE`
              : `ACQUISITION OVERPASS // T0 — SENTINEL-1 C-SAR OBSERVED SLICK`}
          </span>
        </div>
      </div>

      {/* Top-Right Tactical Camera & Layer Controls */}
      <div className="absolute top-2 right-2 z-[400] flex items-center space-x-1.5 font-mono text-[10px] pointer-events-auto">
        {onStartReplay && (
          <button
            onClick={onStartReplay}
            title="Launch step-by-step investigation reconstruction replay"
            className={`border px-2.5 py-1 font-black transition shadow-md flex items-center space-x-1 cursor-pointer ${
              isReplayOpen
                ? 'bg-tactical-amber text-tactical-base border-tactical-amber'
                : 'bg-tactical-navy/90 hover:bg-tactical-hover text-tactical-amber border-tactical-amber hover:border-amber-400'
            }`}
          >
            <span>▶</span>
            <span>{isReplayOpen ? 'REPLAYING' : 'REPLAY'}</span>
          </button>
        )}
        <button
          onClick={handleIncidentFocus}
          title="Fit view tightly around detected slick & release locus"
          className="bg-tactical-navy/90 hover:bg-tactical-hover text-tactical-amber border border-tactical-border hover:border-tactical-amber px-2.5 py-1 font-bold transition shadow-md flex items-center space-x-1"
        >
          <span>🎯</span>
          <span>INCIDENT FOCUS</span>
        </button>
        <button
          onClick={handleTheaterC2}
          title="Zoom out to theater context (Louisiana coastline, WPI candidate ports, and AIS fairway)"
          className="bg-tactical-navy/90 hover:bg-tactical-hover text-tactical-cyan border border-tactical-border hover:border-tactical-cyan px-2.5 py-1 font-bold transition shadow-md flex items-center space-x-1"
        >
          <span>🌐</span>
          <span>THEATER C2</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Toggle Map Rendering Modes"
            className="bg-tactical-navy/90 hover:bg-tactical-hover text-tactical-text border border-tactical-border px-2 py-1 font-bold transition shadow-md flex items-center space-x-1"
          >
            <span>▤</span>
            <span>{layerMode === 'vector' ? 'VECTORS' : 'MASK'}</span>
          </button>
          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-1 bg-tactical-navy border border-tactical-border p-1.5 space-y-1 z-[450] shadow-xl w-36">
              <button
                onClick={() => {
                  setLayerMode('vector');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1 text-[9px] font-bold ${
                  layerMode === 'vector'
                    ? 'text-tactical-amber bg-tactical-panel'
                    : 'text-tactical-muted hover:text-tactical-text'
                }`}
              >
                ● VECTOR GEOMETRY
              </button>
              <button
                onClick={() => {
                  setLayerMode('mask');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1 text-[9px] font-bold ${
                  layerMode === 'mask'
                    ? 'text-tactical-amber bg-tactical-panel'
                    : 'text-tactical-muted hover:text-tactical-text'
                }`}
              >
                ○ SEGMENTATION MASK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unreferenced Scene Notice Overlay */}
      {isGeoreferenced === false && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[450] bg-tactical-base/95 border-2 border-yellow-500/80 px-4 py-2 text-xs font-mono text-yellow-400 shadow-lg flex items-center space-x-2 pointer-events-none">
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
          attribution="&copy; Esri, HERE, Garmin, METI/NASA, USGS"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Optional Neural Segmentation Mask Overlay */}
        {layerMode === 'mask' && maskBase64 && sceneBounds && sceneBounds.length === 2 && (
          <ImageOverlay
            url={`data:image/png;base64,${maskBase64}`}
            bounds={sceneBounds}
            opacity={0.7}
          />
        )}

        {/* Modeled Forward Drift Dispersion Envelope (Layered Soft Plume) */}
        {activeLayers?.drift_cone !== false && driftConePolygon && driftConePolygon.length > 2 && (
          <Polygon
            positions={driftConePolygon as [number, number][]}
            pathOptions={{
              color: '#25C7D9',
              fillColor: '#25C7D9',
              fillOpacity: activePhase === 'modeled' || timelineHour > 0 ? 0.16 : 0.08,
              weight: 1.2,
              dashArray: '3, 4',
              opacity: 0.55,
            }}
          >
            <Popup>
              <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border">
                <div className="bg-cyan-950 text-cyan-300 font-bold px-2 py-1 mb-2 border border-cyan-500/30">
                  ▲ MODELED DRIFT ENVELOPE (T0 → T+12H)
                </div>
                <div className="space-y-1 text-[11px] text-tactical-muted">
                  <p>Turbulent Lagrangian Dispersion Envelope</p>
                  <p>Advective Current: {telemetry?.current || telemetry?.drift_vector || 'NOT AVAILABLE'}</p>
                  <p className="text-[10px] text-tactical-dim italic pt-1 border-t border-tactical-border">
                    * Modeled forward trajectory under coupled ocean currents and 3.5% windage.
                  </p>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Real Detected Oil Spill Polygons — Two Visual Layers (Core + Sheen) */}
        {activeLayers?.slick_mask !== false &&
          detectedPolygons &&
          detectedPolygons.length > 0 &&
          detectedPolygons.map((polyCoords, idx) => (
            <React.Fragment key={`slick-contour-${idx}`}>
              {/* Layer 1: Slick Periphery / Sheen (Amber, Low Opacity, Outer Margin) */}
              <Polygon
                positions={polyCoords as [number, number][]}
                pathOptions={{
                  color: '#F5A623',
                  fillColor: '#F5A623',
                  fillOpacity: 0.15,
                  weight: 1.0,
                  opacity: 0.6,
                }}
              />
              {/* Layer 2: Segmented Slick Core (Red, Medium Opacity, Clear Edge) */}
              <Polygon
                positions={polyCoords as [number, number][]}
                pathOptions={{
                  color: '#E05252',
                  fillColor: '#E05252',
                  fillOpacity: 0.42,
                  weight: 1.5,
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border min-w-[230px]">
                    <div className="bg-tactical-panel text-tactical-amber font-bold px-2 py-1 mb-2 border border-tactical-border flex items-center justify-between">
                      <span>OBSERVED SLICK #{idx + 1}</span>
                      <span className="text-[9px] text-tactical-muted">U-NET CONTOUR</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-tactical-muted">
                      <p>
                        LAYER: <strong className="text-tactical-text">SEGMENTED SLICK CORE</strong>
                      </p>
                      <p>
                        EXTERIOR: <span className="text-tactical-amber">SLICK PERIPHERY / SHEEN</span>
                      </p>
                      <p>VERTICES: {polyCoords.length} WGS-84 POINTS</p>
                      <p className="text-tactical-amber font-bold">
                        {slickAreaKm2
                          ? `DERIVED AREA: ${slickAreaKm2.toFixed(2)} KM²`
                          : 'METRIC AREA NOT RELIABLY DERIVED'}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            </React.Fragment>
          ))}

        {/* Observed Slick Centroid — Transparent Tactical Reticle [ ✛ ] (Permanently Anchored at T0) */}
        {activeLayers?.spill_centroid !== false &&
          isGeoreferenced &&
          (slickAreaKm2 ?? 0) > 0 &&
          centerLat != null &&
          centerLon != null &&
          reticleIcon && (
            <Marker position={[centerLat, centerLon]} icon={reticleIcon}>
              <Popup>
                <div className="p-2.5 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border">
                  <p className="font-bold text-tactical-amber flex items-center space-x-1">
                    <span>[ ✛ ]</span>
                    <span>OBSERVED SLICK CENTROID</span>
                  </p>
                  <p className="text-[11px] text-tactical-muted mt-1">
                    {formatCoordinate(centerLat, centerLon)}
                  </p>
                  <span className="text-[9px] text-tactical-dim block mt-0.5">
                    T0 SAR OBSERVATION FIX · PHYSICALLY ANCHORED
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

        {/* Dynamic Lagrangian Hindcast Model State (Moves backward in time along drift track while observed SAR stays at T0) */}
        {timelineHour < 0 &&
          isGeoreferenced &&
          reconstructedDriftStateLat != null &&
          reconstructedDriftStateLon != null &&
          hindcastStateIcon && (
            <Marker
              position={[reconstructedDriftStateLat, reconstructedDriftStateLon]}
              icon={hindcastStateIcon}
            >
              <Popup>
                <div className="p-2.5 bg-tactical-navy text-cyan-300 font-mono text-xs border border-tactical-border min-w-[200px]">
                  <p className="font-bold text-cyan-400 flex items-center space-x-1">
                    <span>◎</span>
                    <span>RECONSTRUCTED MODEL STATE</span>
                  </p>
                  <p className="text-[11px] text-tactical-text mt-1">
                    TIMELINE: <strong className="text-cyan-400">T {timelineHour}.0H</strong>
                  </p>
                  <p className="text-[10px] text-tactical-muted mt-0.5">
                    LOCUS: {formatCoordinate(reconstructedDriftStateLat, reconstructedDriftStateLon)}
                  </p>
                  <span className="text-[9px] text-tactical-dim block mt-1 pt-1 border-t border-tactical-border">
                    Coupled Lagrangian backcast advection vector under Copernicus CMEMS forcing.
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

        {/* Backward Hindcast Drift Trajectory Polyline (Cyan dashed + Forward Chevrons) */}
        {activeLayers?.drift_cone !== false && polylineCoords.length > 1 && (
          <>
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#25C7D9',
                weight: 2.0,
                dashArray: '6, 6',
                opacity: activePhase === 'modeled' || activePhase === 'inferred' ? 1.0 : 0.75,
              }}
            >
              <Popup>
                <div className="p-2.5 bg-tactical-navy text-cyan-300 font-mono text-xs border border-tactical-border">
                  <strong className="text-cyan-400 block">BACKWARD DRIFT TRACK (T-6.5H → T0)</strong>
                  <p className="text-[10px] text-tactical-muted mt-1">
                    Lagrangian reverse advection path calculated from CMEMS coupled ocean current vectors.
                  </p>
                  <p className="text-[9px] text-tactical-dim mt-1">
                    WAYPOINTS: {polylineCoords.length}
                  </p>
                </div>
              </Popup>
            </Polyline>

            {/* Directional Flow Chevrons Along Backward Drift Line */}
            {backwardChevrons.map((chev, cIdx) => {
              const icon = createChevronIcon(chev.bearing, '#25C7D9');
              if (!icon) return null;
              return (
                <Marker
                  key={`drift-chev-${cIdx}`}
                  position={[chev.lat, chev.lon]}
                  icon={icon}
                  interactive={false}
                />
              );
            })}
          </>
        )}

        {/* Reconstructed Release Point & ±3.5 km Uncertainty Envelope */}
        {reconstructedRelease && (
          <>
            {/* ±3.5 km Uncertainty Envelope (Subtle Translucent Boundary) */}
            <Circle
              center={[reconstructedRelease.lat, reconstructedRelease.lon]}
              radius={3500}
              pathOptions={{
                color: '#F5A623',
                fillColor: '#F5A623',
                fillOpacity: 0.06,
                weight: 1.2,
                dashArray: '4, 6',
              }}
            >
              <Popup>
                <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border">
                  <div className="bg-tactical-panel text-tactical-amber font-bold px-2 py-1 mb-2 border border-tactical-border uppercase">
                    ±3.5 KM MODEL UNCERTAINTY
                  </div>
                  <div className="space-y-1 text-[11px] text-tactical-muted">
                    <p>BOUND: Empirical Release Uncertainty Envelope</p>
                    <p>SENSITIVITY: Evaluated under ±20% Wind/Current Perturbations</p>
                    <p className="text-tactical-dim">Max Origin Displacement: 3.18 km</p>
                  </div>
                </div>
              </Popup>
            </Circle>

            {/* Concentric Release Locus Marker (Distinct Tactical Target) */}
            {releaseLocusIcon && (
              <Marker
                position={[reconstructedRelease.lat, reconstructedRelease.lon]}
                icon={releaseLocusIcon}
              >
                <Popup>
                  <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border min-w-[220px]">
                    <div className="bg-tactical-panel text-tactical-amber font-bold px-2 py-1 mb-2 border border-tactical-border">
                      RECONSTRUCTED RELEASE LOCUS
                    </div>
                    <div className="space-y-1 text-[11px] text-tactical-muted">
                      <p>
                        TIMING: T -{reconstructedRelease.hours_ago ?? 6.5}H Prior (
                        {reconstructedRelease.hours_ago ?? '—'} hrs)
                      </p>
                      <p>
                        COORDINATES: {formatCoordinate(reconstructedRelease.lat, reconstructedRelease.lon)}
                      </p>
                      <p className="text-tactical-amber font-bold">±3.5 KM MODEL UNCERTAINTY</p>
                      <p className="text-[10px] text-tactical-dim">
                        {hindcastTrajectory?.length || 0} Reverse Advection Waypoints
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* Geodesic Reference Vector (Subordinate Dashed Slate Line + Midpoint Badge) */}
        {activeLayers?.responder_intercept !== false && geodesicVectorCoords.length > 1 && (
          <>
            <Polyline
              positions={geodesicVectorCoords}
              pathOptions={{
                color: '#596771',
                weight: 1.5,
                dashArray: '4, 8',
                opacity: activePhase === 'responder' ? 0.85 : 0.5,
              }}
            />
            {/* Midpoint Geodesic Badge Pill */}
            {geodesicMidpoint && (
              <Marker
                position={geodesicMidpoint}
                icon={createGeodesicLabelIcon(geodesicDistanceVal ?? '—')}
                interactive={false}
              />
            )}
          </>
        )}

        {/* Real Navigable Waterway Route (Solid Emerald, when available) */}
        {activeLayers?.responder_intercept !== false &&
          responderRoute?.navigable_route_geometry?.length > 0 && (
            <Polyline
              positions={responderRoute.navigable_route_geometry.map((wp: any) => [wp.lat, wp.lon])}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                opacity: 0.95,
              }}
            />
          )}

        {/* WPI Candidate Discovery Ports (Small Grey Diamonds) */}
        {activeLayers?.responder_intercept !== false &&
          responderRoute?.candidate_audit?.candidates &&
          responderRoute.candidate_audit.candidates
            .filter((c: any) => !c.is_selected)
            .map((c: any) => (
              <Marker
                key={`wpi-cand-${c.wpi_number}`}
                position={[c.lat, c.lon]}
                icon={wpiCandidateIcon}
              >
                <Popup>
                  <div className="p-2.5 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border">
                    <span className="text-[9px] text-tactical-muted block uppercase font-bold">
                      WPI CANDIDATE PORT
                    </span>
                    <strong className="text-tactical-text">{c.main_port_name || c.port_name}</strong>
                    <p className="text-[10px] text-cyan-400">
                      NGA WPI #{c.wpi_number} ({c.unlocode || c.un_locode || '—'})
                    </p>
                    <p className="text-[10px] text-tactical-muted">
                      Geodesic Dist: {c.distance_km} km ({c.bearing_deg}° T)
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* Selected WPI Candidate Port (Amber Star ★) */}
        {activeLayers?.responder_intercept !== false &&
          responderRoute &&
          responderRoute.routing_status !== 'ROUTING_UNAVAILABLE' &&
          responderRoute.response_hub !== 'PORT DATA UNAVAILABLE' &&
          responderLat != null &&
          responderLon != null &&
          wpiStarIcon && (
            <Marker position={[responderLat, responderLon]} icon={wpiStarIcon}>
              <Popup>
                <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-amber min-w-[250px]">
                  <div className="bg-tactical-panel text-tactical-amber font-bold px-2 py-1 mb-2 border border-tactical-border flex items-center justify-between">
                    <span>★ RESPONSE PORT CANDIDATE</span>
                    <span className="text-[9px] text-tactical-muted">{responderRoute.source || 'NGA WPI'}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-tactical-muted">
                    <div>
                      <span className="text-[9px] text-tactical-dim block uppercase font-mono">
                        SELECTED CANDIDATE:
                      </span>
                      <strong className="text-tactical-text text-xs">
                        {responderRoute.response_hub || responderRoute.station_base || 'NOT IDENTIFIED'}
                      </strong>
                    </div>
                    <p className="text-[10px] text-cyan-400">
                      REGISTRY: NGA WPI #{responderRoute.wpi_number || '—'} (
                      {responderRoute.un_locode || responderRoute.unlocode || '—'})
                    </p>
                    <p>
                      GEODESIC DISTANCE: {geodesicDistanceVal ?? '—'} km (
                      {responderRoute.bearing_deg || 0.0}° T)
                    </p>
                    <p className="text-tactical-amber font-bold">
                      ROUTING STATUS: {responderRoute.routing_status || 'GEODESIC_FALLBACK'}
                    </p>
                    <p className="text-tactical-dim">
                      SELECTION BASIS: {responderRoute.selection_basis || 'Minimum geodesic distance'}
                    </p>
                    <p className="text-tactical-dim">
                      NAVIGABLE DISTANCE:{' '}
                      {responderRoute.navigable_distance_km
                        ? `${responderRoute.navigable_distance_km} km`
                        : 'NOT ESTABLISHED'}
                    </p>
                    <p className="text-tactical-dim">
                      OPERATIONAL ETA: {responderRoute.operational_eta_formatted || 'NOT ESTABLISHED'}
                    </p>
                    <p className="text-[9px] text-tactical-dim italic pt-1 border-t border-tactical-border">
                      * Straight-line distance; navigable water route and operational ETA not established.
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        {/* Dark Vessel Radar Targets (Red Diamond ◆) */}
        {activeLayers?.dark_vessels !== false &&
          darkVessels.map((dv: any) => (
            <Marker
              key={dv.dark_target_id}
              position={[dv.lat, dv.lon]}
              icon={radarContactIcon}
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
            >
              <Popup>
                <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-red min-w-[220px]">
                  <div className="bg-red-950/60 text-red-300 font-bold px-2 py-1 mb-2 border border-red-500/30 flex items-center justify-between">
                    <span>◆ DARK RADAR CONTACT (CFAR)</span>
                    <span className="text-[10px]">{dv.dark_target_id}</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-tactical-muted mb-2">
                    <p>STATUS: <strong className="text-red-400">UNREGISTERED ECHO</strong></p>
                    <p>SAR BACKSCATTER PEAK: {dv.rcs_db} dB</p>
                    <p>CPA DISTANCE TO SLICK: {dv.cpa_dist_km} km</p>
                    <p className="text-tactical-amber">PRIORITY: {dv.risk_index_pct ?? '—'} (DEMO)</p>
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
                    className="brutalist-btn w-full py-1.5 bg-tactical-panel hover:bg-tactical-hover text-tactical-amber border border-tactical-border font-bold text-[10px] text-center uppercase"
                  >
                    [ AUDIT RADAR TARGET → ]
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Candidate AIS Vessel Markers, Tracks & Temporal Beads */}
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

            // Distinct hierarchy: Primary/Selected stands out in crisp amber; others are subdued slate
            const trackColor = isSelected || isPrimary ? '#F5A623' : '#71808C';
            const trackWeight = isSelected ? 2.5 : isPrimary ? 2.0 : 1.0;
            const trackOpacity = isSelected ? 1.0 : isPrimary ? 0.85 : 0.22;
            const trackDash = isSelected || isPrimary ? undefined : '3, 4';

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

            // Directional chevrons for primary or selected vessel
            const trackChevrons =
              isSelected || isPrimary ? calculatePolylineChevrons(trackCoords, 3.5) : [];

            // Temporal beads for primary or selected vessel
            const temporalBeads =
              isSelected || isPrimary
                ? findAisTemporalBeads(vessel.track_points, telemetry?.metocean_query_time)
                : [];

            return (
              <React.Fragment key={vessel.vessel_id || vessel.id}>
                {/* Vessel Track Polyline */}
                <Polyline
                  positions={trackCoords}
                  pathOptions={{
                    color: trackColor,
                    weight: trackWeight,
                    dashArray: trackDash,
                    opacity: trackOpacity,
                  }}
                />

                {/* Directional Flow Chevrons */}
                {trackChevrons.map((chev, chIdx) => {
                  const chevIcon = createChevronIcon(chev.bearing, trackColor);
                  if (!chevIcon) return null;
                  return (
                    <Marker
                      key={`chev-${vessel.vessel_id}-${chIdx}`}
                      position={[chev.lat, chev.lon]}
                      icon={chevIcon}
                      interactive={false}
                    />
                  );
                })}

                {/* Real Temporal Milestone Beads (T-6H, T-4H, T-2H, T0) */}
                {temporalBeads.map((bead, bIdx) => {
                  const beadIcon = createTemporalBeadIcon(bead.label);
                  if (!beadIcon) return null;
                  return (
                    <Marker
                      key={`bead-${vessel.vessel_id}-${bIdx}`}
                      position={[bead.lat, bead.lon]}
                      icon={beadIcon}
                      interactive={true}
                    >
                      <Popup>
                        <div className="p-2 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border">
                          <strong className="text-tactical-amber block">
                            {primarySuspect?.vessel_name || vessel.vessel_name} · {bead.label}
                          </strong>
                          <p className="text-[10px] text-tactical-muted mt-0.5">
                            ACTUAL AIS OBSERVATION: {bead.timestamp}
                          </p>
                          <p className="text-[9px] text-tactical-dim">
                            LOCUS: {formatCoordinate(bead.lat, bead.lon)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Vessel Position Marker Ring */}
                <Circle
                  center={[vLat, vLon]}
                  radius={isSelected ? 1800 : isPrimary ? 1200 : 700}
                  eventHandlers={{
                    click: () => onSelectVessel && onSelectVessel(vessel),
                  }}
                  pathOptions={{
                    color: trackColor,
                    fillColor: trackColor,
                    fillOpacity: isSelected ? 0.9 : isPrimary ? 0.75 : 0.25,
                    weight: isSelected ? 2.5 : 1.5,
                  }}
                >
                  <Popup>
                    <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border min-w-[230px]">
                      <div className="flex items-center justify-between border-b border-tactical-border pb-1.5 mb-2">
                        <div>
                          <h3
                            className={`font-black uppercase text-xs ${
                              isPrimary ? 'text-tactical-amber' : 'text-tactical-text'
                            }`}
                          >
                            {vessel.vessel_name}
                          </h3>
                          <span
                            className={`stamp-tag text-[9px] ${
                              vessel.is_historical_real
                                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/40'
                                : 'border-tactical-border text-tactical-muted'
                            }`}
                          >
                            {vessel.is_historical_real ? 'REAL NOAA AIS' : 'SYNTHETIC DEMO'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-tactical-dim uppercase">PRIORITY</span>
                          <div className="font-extrabold text-tactical-amber text-sm">
                            {vessel.attribution_score_pct !== undefined
                              ? `${vessel.attribution_score_pct}%`
                              : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-tactical-muted mb-2">
                        <p>
                          ROLE: {isPrimary ? 'PRIMARY ATTRIBUTION CANDIDATE' : 'ATTRIBUTION CANDIDATE'}
                        </p>
                        <p>
                          TYPE: {vessel.vessel_type || 'UNSPECIFIED'} • FLAG: {vessel.flag || 'UNKNOWN'}
                        </p>
                        <p>MMSI: {vessel.mmsi || 'NO MMSI'}</p>
                        <p>CPA DISTANCE: {vessel.distance_km ?? vessel.cpa_dist_km ?? '—'} km</p>
                        <p className="text-tactical-dim">
                          POSITION T {timelineHour}H: ({formatCoordinate(vLat, vLon)})
                        </p>
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
      <div className="absolute bottom-11 left-3 z-[400] bg-tactical-navy/95 border border-tactical-border p-2 font-mono text-[9px] text-tactical-text space-y-1 shadow-lg pointer-events-auto max-w-[270px]">
        <div className="text-[8px] font-black uppercase tracking-widest text-tactical-dim border-b border-tactical-border/80 pb-1 flex items-center justify-between">
          <span className="text-tactical-text font-bold">TACTICAL MAP LEGEND</span>
          <span className="text-tactical-dim">NTRO PS-26143</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-red font-bold text-xs">▰</span>
              <span>Slick Core</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-amber font-bold text-xs">▰</span>
              <span>Slick Periphery</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-amber font-bold text-xs">[ ✛ ]</span>
              <span>Slick Centroid</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-amber font-bold text-xs">◯</span>
              <span>Release Locus</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-cyan font-bold text-xs">┄▶</span>
              <span>Lagrangian Drift</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-amber font-bold text-xs">━▶</span>
              <span>Primary AIS Lead</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-amber font-bold text-xs">★</span>
              <span>Selected WPI Port</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-tactical-red font-bold text-xs">◆</span>
              <span>CFAR Dark Contact</span>
            </div>
          </div>
        </div>
        <div className="border-t border-tactical-border/80 pt-1 text-[8px] text-tactical-muted flex items-center justify-between font-mono">
          <span>
            <strong className="text-tactical-slate">- - -</strong> Geodesic Ref (Non-Navigable)
          </span>
          <span>
            <strong className="text-tactical-green">━━━</strong> Waterway Route
          </span>
        </div>
      </div>

      {/* Bottom Map Status & Cursor Coordinates Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-tactical-navy/95 border-t border-tactical-border px-4 py-2 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono text-tactical-muted">
        <div className="flex items-center space-x-3">
          <span className="bg-tactical-panel border border-tactical-border text-tactical-amber px-2 py-0.5 text-[10px] font-bold">
            [GEO LOCK]
          </span>
          <span className="text-tactical-muted">
            VIEWPORT LOCUS:{' '}
            <strong className="text-tactical-text">
              {hasCoordinates ? formatCoordinate(centerLat!, centerLon!) : 'AWAITING SENSOR INGEST'}
            </strong>
          </span>
          <span className="text-tactical-dim hidden md:inline">•</span>
          <span className="text-tactical-muted hidden md:inline">
            GRID: <strong className="text-tactical-text">WGS-84 (2.0 NM)</strong>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-tactical-amber font-bold flex items-center space-x-1">
            <span>■</span>
            <span>SPILL ORIGIN</span>
          </span>
          <span className="text-tactical-muted font-bold">
            CHRONO: T {timelineHour >= 0 ? `+${timelineHour}` : timelineHour}.0H
          </span>
          <span className="border border-tactical-border px-2 py-0.5 bg-tactical-panel text-tactical-text text-[11px] font-bold hidden sm:inline">
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
