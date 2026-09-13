'use client';

import React from 'react';

interface BrutalistLayersProps {
  activeLayers: Record<string, boolean>;
  toggleLayer: (layerKey: string) => void;
}

export default function BrutalistLayers({
  activeLayers,
  toggleLayer,
}: BrutalistLayersProps) {
  const layers = [
    { key: 'sar_scene', num: '01', label: 'SAR SCENE', fallbackKey: 'slick_mask' },
    { key: 'oil_mask', num: '02', label: 'OIL MASK', fallbackKey: 'slick_mask' },
    { key: 'lookalike_mask', num: '03', label: 'LOOKALIKE', fallbackKey: 'slick_mask' },
    { key: 'spill_centroid', num: '04', label: 'CENTROID', fallbackKey: 'slick_mask' },
    { key: 'hindcast', num: '05', label: 'HINDCAST', fallbackKey: 'drift_cone' },
    { key: 'forecast', num: '06', label: 'FORECAST', fallbackKey: 'drift_cone' },
    { key: 'uncertainty', num: '07', label: 'UNCERTAINTY', fallbackKey: 'drift_cone' },
    { key: 'ais_traffic', num: '08', label: 'AIS TRAFFIC', fallbackKey: 'ais_tracks' },
    { key: 'investigative_leads', num: '09', label: 'TOP LEADS', fallbackKey: 'ais_tracks' },
    { key: 'dark_targets', num: '10', label: 'DARK CFAR', fallbackKey: 'dark_vessels' },
    { key: 'responder_vector', num: '11', label: 'RESPONDER', fallbackKey: 'responder_intercept' },
  ];

  return (
    <div className="bg-concrete-950 border-b border-concrete-800 px-4 py-2 flex items-center overflow-x-auto select-none font-mono text-xs">
      <div className="flex items-center space-x-2 shrink-0 pr-3 border-r border-concrete-800">
        <span className="w-2 h-2 bg-safety-orange inline-block"></span>
        <span className="text-concrete-400 font-bold text-[10px] tracking-widest uppercase">
          EVIDENCE LAYERS:
        </span>
      </div>

      <div className="flex items-center space-x-1 pl-3 shrink-0">
        {layers.map((layer) => {
          // Resolve state against existing activeLayers mapping or default true
          const isActive =
            activeLayers[layer.key] !== undefined
              ? activeLayers[layer.key]
              : activeLayers[layer.fallbackKey] !== undefined
              ? activeLayers[layer.fallbackKey]
              : true;

          return (
            <button
              key={layer.key}
              onClick={() => {
                // Toggle both specific key and fallback key for full system compatibility
                toggleLayer(layer.fallbackKey);
                if (layer.key !== layer.fallbackKey) {
                  toggleLayer(layer.key);
                }
              }}
              className={`px-2.5 py-1 text-[10px] font-bold tracking-wider flex items-center space-x-1.5 transition uppercase border ${
                isActive
                  ? 'bg-concrete-900 text-concrete-100 border-safety-orange'
                  : 'bg-concrete-950 text-concrete-600 border-concrete-800 hover:text-concrete-400 hover:border-concrete-700'
              }`}
            >
              <span className={isActive ? 'text-safety-orange' : 'text-concrete-600'}>
                {isActive ? '■' : '□'}
              </span>
              <span className="text-concrete-500">{layer.num}</span>
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
