'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { formatCoordinate } from '../utils/geo';
import { API_BASE } from '../utils/api';

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
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

export interface TheaterScene {
  scene_id: string;
  name: string;
  theater: string;
  category: 'VERIFIED OIL SCENE' | 'LOOKALIKE / NON-SPILL' | 'UNREFERENCED SCENE';
  lat: number | null;
  lon: number | null;
  is_georeferenced: boolean;
  spill_area_sq_km: number | null;
  estimated_volume_m3?: number | null;
  acquisition_date: string;
  sensor: string;
  preset_id?: string | null;
  description: string;
}

interface GlobalTheaterViewProps {
  onLoadSceneInC2: (scene: TheaterScene) => void;
  onReturnToC2: () => void;
}

export default function GlobalTheaterView({
  onLoadSceneInC2,
  onReturnToC2,
}: GlobalTheaterViewProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [LInstance, setLInstance] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(3);

  const [scenes, setScenes] = useState<TheaterScene[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScene, setSelectedScene] = useState<TheaterScene | null>(null);

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

  // Fetch Global Scenes from backend
  useEffect(() => {
    async function fetchScenes() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/theater/scenes`);
        if (res.ok) {
          const data = await res.json();
          setScenes(data);
        }
      } catch (err) {
        console.error('Failed to load theater scenes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScenes();
  }, []);

  // Filtered Scene Catalog
  const filteredScenes = useMemo(() => {
    return scenes.filter((s) => {
      const matchCat = filterCategory === 'ALL' || s.category === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.scene_id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.theater.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [scenes, filterCategory, searchQuery]);

  // Regional Clustering for Zoom < 6
  // Groups nearby georeferenced scenes into regional clusters to prevent visual clutter
  const regionalClusters = useMemo(() => {
    const georef = filteredScenes.filter((s) => s.lat != null && s.lon != null);
    const clusters: Array<{
      id: string;
      label: string;
      lat: number;
      lon: number;
      scenes: TheaterScene[];
      hasOil: boolean;
      hasLookalike: boolean;
    }> = [];

    const visited = new Set<string>();

    for (let i = 0; i < georef.length; i++) {
      const s1 = georef[i];
      if (visited.has(s1.scene_id)) continue;

      const group = [s1];
      visited.add(s1.scene_id);

      for (let j = i + 1; j < georef.length; j++) {
        const s2 = georef[j];
        if (visited.has(s2.scene_id)) continue;

        // Approx distance threshold in degrees (~800 km)
        const dLat = Math.abs(s1.lat! - s2.lat!);
        const dLon = Math.abs(s1.lon! - s2.lon!);
        if (dLat < 7.5 && dLon < 9.0) {
          group.push(s2);
          visited.add(s2.scene_id);
        }
      }

      const avgLat = group.reduce((acc, cur) => acc + cur.lat!, 0) / group.length;
      const avgLon = group.reduce((acc, cur) => acc + cur.lon!, 0) / group.length;

      clusters.push({
        id: `cluster-${s1.scene_id}`,
        label: group.length > 1 ? `${group[0].theater.split('//')[0].trim()} (${group.length})` : group[0].name,
        lat: avgLat,
        lon: avgLon,
        scenes: group,
        hasOil: group.some((g) => g.category === 'VERIFIED OIL SCENE'),
        hasLookalike: group.some((g) => g.category === 'LOOKALIKE / NON-SPILL'),
      });
    }

    return clusters;
  }, [filteredScenes]);

  // Tactical DivIcons
  const createClusterIcon = useCallback(
    (count: number, hasOil: boolean) => {
      if (!LInstance) return null;
      const color = hasOil ? '#F5A623' : '#25C7D9';
      return LInstance.divIcon({
        className: 'tactical-cluster-badge',
        html: `
          <div style="background:#0B1117f2; border:1.5px solid ${color}; color:${color}; padding:3px 8px; border-radius:12px; font-family:monospace; font-size:10px; font-weight:bold; display:flex; align-items:center; gap:4px; box-shadow:0 3px 8px rgba(0,0,0,0.8); cursor:pointer;">
            <span style="width:6px; height:6px; border-radius:50%; background:${color};"></span>
            <span>${count} ${count === 1 ? 'SCENE' : 'SCENES'}</span>
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });
    },
    [LInstance]
  );

  const createSceneMarkerIcon = useCallback(
    (category: string, isSelected: boolean) => {
      if (!LInstance) return null;
      const isOil = category === 'VERIFIED OIL SCENE';
      const color = isOil ? '#F5A623' : '#25C7D9';
      const size = isSelected ? 28 : 22;
      return LInstance.divIcon({
        className: 'tactical-scene-marker',
        html: `
          <div style="position:relative; width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            ${isSelected ? `<div style="position:absolute; width:${size + 8}px; height:${size + 8}px; border-radius:50%; border:1.5px solid ${color}; opacity:0.6; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#070B0F" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="${color}" fill-opacity="0.85"/>
              <circle cx="12" cy="12" r="3" fill="#070B0F"/>
            </svg>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    },
    [LInstance]
  );

  const handleFocusScene = (scene: TheaterScene) => {
    setSelectedScene(scene);
    if (mapInstance && scene.lat != null && scene.lon != null) {
      mapInstance.flyTo([scene.lat, scene.lon], 7, { duration: 1.2 });
    }
  };

  const handleClusterClick = (c: { lat: number; lon: number; scenes: TheaterScene[] }) => {
    if (mapInstance) {
      mapInstance.flyTo([c.lat, c.lon], 6, { duration: 1.0 });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-tactical-base font-mono text-xs select-none">
      {/* Theater Top Command Bar */}
      <div className="bg-tactical-navy border-b border-tactical-border px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onReturnToC2}
            className="bg-tactical-panel hover:bg-tactical-hover text-tactical-text border border-tactical-border px-2.5 py-1 font-bold text-[10px] flex items-center space-x-1 transition cursor-pointer"
            title="Return to primary tactical C2 console"
          >
            <span>←</span>
            <span>BACK TO C2 WORKSTATION</span>
          </button>
          <span className="text-tactical-dim">|</span>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-tactical-cyan animate-pulse"></span>
            <h2 className="text-sm font-black text-tactical-text uppercase tracking-wider font-display">
              GLOBAL INCIDENT THEATER // VERIFIED SATELLITE CATALOG
            </h2>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="flex items-center space-x-4 text-[10px]">
          <div>
            <span className="text-tactical-dim">TOTAL CATALOGED: </span>
            <strong className="text-tactical-text font-bold">{scenes.length} SCENES</strong>
          </div>
          <span className="text-tactical-border">•</span>
          <div>
            <span className="text-tactical-dim">VERIFIED SPILLS: </span>
            <strong className="text-tactical-amber font-bold">
              {scenes.filter((s) => s.category === 'VERIFIED OIL SCENE').length}
            </strong>
          </div>
          <span className="text-tactical-border">•</span>
          <div>
            <span className="text-tactical-dim">LOOKALIKES: </span>
            <strong className="text-tactical-cyan font-bold">
              {scenes.filter((s) => s.category === 'LOOKALIKE / NON-SPILL').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Global Map + Catalog Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Left Side: Global Clustered Leaflet Map */}
        <div className="flex-1 relative min-h-[460px] bg-tactical-base">
          {/* Zoom Level Indicator */}
          <div className="absolute top-3 left-3 z-[400] bg-tactical-navy/90 border border-tactical-border px-2.5 py-1 text-[10px] text-tactical-muted pointer-events-none shadow-md">
            <span>SCALE: </span>
            <strong className="text-tactical-amber">
              {currentZoom < 6 ? 'GLOBAL CLUSTERED THEATER' : 'REGIONAL SCENE FOCUS'}
            </strong>
            <span className="text-tactical-dim ml-2">(ZOOM {currentZoom})</span>
          </div>

          {/* Map Surface */}
          {(!mounted || !leafletLoaded) ? (
            <div className="w-full h-full flex items-center justify-center bg-tactical-base text-tactical-muted font-mono">
              <span>INITIALIZING GLOBAL THEATER SURFACE...</span>
            </div>
          ) : (
            <MapContainer
              ref={setMapInstance}
              center={[20.0, 0.0]}
              zoom={3}
              scrollWheelZoom={true}
              className="w-full h-full min-h-[500px]"
            >
              <TileLayer
                attribution="&copy; Esri, HERE, Garmin, METI/NASA, USGS"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              />

              {/* Render Clusters when Zoom < 6 */}
              {currentZoom < 6 &&
                regionalClusters.map((cluster) => {
                  const icon = createClusterIcon(cluster.scenes.length, cluster.hasOil);
                  if (!icon) return null;
                  return (
                    <Marker
                      key={cluster.id}
                      position={[cluster.lat, cluster.lon]}
                      icon={icon}
                      eventHandlers={{
                        click: () => handleClusterClick(cluster),
                      }}
                    >
                      <Popup>
                        <div className="p-2.5 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border min-w-[200px]">
                          <div className="text-[10px] font-bold text-tactical-amber uppercase pb-1 border-b border-tactical-border">
                            {cluster.label}
                          </div>
                          <div className="space-y-1 mt-1 text-[10px] text-tactical-muted">
                            <p>{cluster.scenes.length} cataloged Sentinel-1 acquisitions</p>
                            <span className="text-[9px] text-tactical-cyan block italic">
                              Click badge or map to zoom into regional scenes
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Render Individual Scene Markers when Zoom >= 6 */}
              {currentZoom >= 6 &&
                filteredScenes
                  .filter((s) => s.lat != null && s.lon != null)
                  .map((scene) => {
                    const isSelected = selectedScene?.scene_id === scene.scene_id;
                    const icon = createSceneMarkerIcon(scene.category, isSelected);
                    if (!icon) return null;
                    return (
                      <Marker
                        key={scene.scene_id}
                        position={[scene.lat!, scene.lon!]}
                        icon={icon}
                        eventHandlers={{
                          click: () => setSelectedScene(scene),
                        }}
                      >
                        <Popup>
                          <div className="p-3 bg-tactical-navy text-tactical-text font-mono text-xs border border-tactical-border min-w-[260px] space-y-2">
                            <div className="flex items-start justify-between gap-2 border-b border-tactical-border pb-1.5">
                              <div>
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border ${
                                  scene.category === 'VERIFIED OIL SCENE'
                                    ? 'border-tactical-amber text-tactical-amber'
                                    : 'border-tactical-cyan text-tactical-cyan'
                                }`}>
                                  {scene.category}
                                </span>
                                <h4 className="font-bold text-xs text-tactical-text mt-1">
                                  {scene.name}
                                </h4>
                              </div>
                              <span className="text-[10px] text-tactical-dim font-mono">
                                #{scene.scene_id}
                              </span>
                            </div>

                            <div className="space-y-1 text-[10px] text-tactical-muted">
                              <p>THEATER: <strong className="text-tactical-text">{scene.theater}</strong></p>
                              <p>POSITION: <span className="font-mono text-tactical-amber">{formatCoordinate(scene.lat!, scene.lon!)}</span></p>
                              {scene.spill_area_sq_km && (
                                <p>AREA: <strong className="text-tactical-text">{scene.spill_area_sq_km.toFixed(1)} KM²</strong></p>
                              )}
                              <p>SENSOR: {scene.sensor} ({scene.acquisition_date.slice(0, 10)})</p>
                            </div>

                            <p className="text-[9px] text-tactical-dim leading-tight pt-1 border-t border-tactical-border">
                              {scene.description}
                            </p>

                            <button
                              onClick={() => onLoadSceneInC2(scene)}
                              className="w-full bg-tactical-amber hover:bg-amber-400 text-tactical-base py-1.5 text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center space-x-1 mt-2"
                            >
                              <span>🔍</span>
                              <span>LOAD INTO C2 WORKSTATION →</span>
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
            </MapContainer>
          )}
        </div>

        {/* Right Side: Incident Catalog Drawer */}
        <aside className="w-full lg:w-[380px] shrink-0 bg-tactical-navy border-l border-tactical-border flex flex-col justify-between font-mono text-xs select-none">
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="border-b border-tactical-border pb-2">
              <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                INCIDENT CATALOG
              </span>
              <h3 className="font-extrabold text-sm uppercase text-tactical-text font-display">
                GLOBAL MARITIME SCENES
              </h3>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH THEATER OR SCENE ID..."
                className="w-full bg-tactical-panel border border-tactical-border text-tactical-text placeholder-tactical-dim text-[11px] px-2.5 py-1.5 focus:border-tactical-amber outline-none font-mono"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[9px] font-bold">
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'VERIFIED OIL SCENE', label: 'OIL SPILL' },
                { id: 'LOOKALIKE / NON-SPILL', label: 'LOOKALIKE' },
                { id: 'UNREFERENCED SCENE', label: 'UNREFERENCED' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  className={`px-2 py-1 border transition cursor-pointer ${
                    filterCategory === f.id
                      ? 'bg-tactical-panel border-tactical-amber text-tactical-amber font-black'
                      : 'bg-tactical-base border-tactical-border text-tactical-muted hover:text-tactical-text'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Scene Cards List */}
            <div className="space-y-2 pt-1">
              {filteredScenes.length === 0 ? (
                <div className="p-4 bg-tactical-panel border border-tactical-border text-center text-tactical-dim">
                  NO MATCHING SCENES FOUND
                </div>
              ) : (
                filteredScenes.map((scene) => {
                  const isSel = selectedScene?.scene_id === scene.scene_id;
                  const isOil = scene.category === 'VERIFIED OIL SCENE';
                  const isUnref = scene.category === 'UNREFERENCED SCENE';

                  return (
                    <div
                      key={scene.scene_id}
                      className={`p-2.5 border transition space-y-2 ${
                        isSel
                          ? 'border-tactical-amber bg-tactical-panel shadow-md'
                          : 'border-tactical-border bg-tactical-panel/60 hover:bg-tactical-panel hover:border-tactical-muted'
                      }`}
                    >
                      {/* Top Row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`text-[8px] font-black uppercase px-1 py-0.2 border ${
                              isOil
                                ? 'border-tactical-amber text-tactical-amber'
                                : isUnref
                                ? 'border-tactical-dim text-tactical-dim'
                                : 'border-tactical-cyan text-tactical-cyan'
                            }`}
                          >
                            {scene.category}
                          </span>
                          <h4 className="font-bold text-xs text-tactical-text mt-1 leading-snug">
                            {scene.name}
                          </h4>
                        </div>
                        <span className="text-[10px] text-tactical-dim font-mono">
                          #{scene.scene_id}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="text-[10px] text-tactical-muted space-y-0.5">
                        <p className="text-tactical-dim">
                          THEATER: <span className="text-tactical-text">{scene.theater}</span>
                        </p>
                        <p>
                          COORDS:{' '}
                          {scene.lat != null && scene.lon != null ? (
                            <span className="text-tactical-amber font-mono">
                              {formatCoordinate(scene.lat, scene.lon)}
                            </span>
                          ) : (
                            <span className="text-yellow-500 font-bold">UNREFERENCED RASTER</span>
                          )}
                        </p>
                        {scene.spill_area_sq_km && (
                          <p>
                            SURFACE AREA:{' '}
                            <strong className="text-tactical-text">
                              {scene.spill_area_sq_km.toFixed(1)} KM²
                            </strong>
                          </p>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-tactical-border/60">
                        {scene.lat != null && (
                          <button
                            onClick={() => handleFocusScene(scene)}
                            className="px-2 py-1 bg-tactical-navy hover:bg-tactical-hover text-tactical-text border border-tactical-border text-[9px] font-bold transition cursor-pointer flex-1"
                          >
                            🎯 FOCUS MAP
                          </button>
                        )}
                        <button
                          onClick={() => onLoadSceneInC2(scene)}
                          className="px-2 py-1 bg-tactical-amber hover:bg-amber-400 text-tactical-base text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex-1 text-center"
                        >
                          🔍 LOAD IN C2
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
