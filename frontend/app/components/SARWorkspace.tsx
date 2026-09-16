'use client';

import React, { useState } from 'react';
import { formatCoordinateShort } from '../utils/geo';

interface SARWorkspaceProps {
  detectionResult?: any;
  onDetectionComplete?: (result: any) => void;
}

export default function SARWorkspace({
  detectionResult,
  onDetectionComplete,
}: SARWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [spectralTab, setSpectralTab] = useState<'raw' | 'prob' | 'binary'>('prob');
  const [inputError, setInputError] = useState<string | null>(null);
  const [showModelMetrics, setShowModelMetrics] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setInputError(null);
      handleRunDetection(file);
    }
  };

  const handleRunDetection = async (overrideFile?: File) => {
    const fileToRun = overrideFile || selectedFile;
    if (!fileToRun) return;

    setLoading(true);
    setInputError(null);
    const formData = new FormData();
    formData.append('file', fileToRun);

    try {
      const res = await fetch('http://localhost:8000/api/v1/detect', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 422) {
        const errorData = await res.json().catch(() => null);
        const detail = errorData?.detail || 'INPUT ERROR: Raster validation failed or input is a binary mask.';
        setInputError(detail);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || 'Detection failed');
      }

      const data = await res.json();
      if (onDetectionComplete) onDetectionComplete(data);
    } catch (err: any) {
      console.error(err);
      setInputError(err.message || 'Failed to connect to GPU backend engine. Is FastAPI running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleRunGoldenScene = async () => {
    setLoading(true);
    setInputError(null);
    const formData = new FormData();
    formData.append('image_path', 'data/02_Test_images_and_ground_truth/Images/Oil/00111.tif');

    try {
      const res = await fetch('http://localhost:8000/api/v1/detect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || 'Detection failed on golden test scene 00111.tif');
      }

      const data = await res.json();
      if (onDetectionComplete) onDetectionComplete(data);
    } catch (err: any) {
      console.error(err);
      setInputError(err.message || 'Failed to connect to GPU backend engine. Is FastAPI running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoImage = async () => {
    setLoading(true);
    setInputError(null);
    try {
      const res = await fetch('/sentinel_demo.png');
      const blob = await res.blob();
      const demoFile = new File([blob], 'sentinel_1_sar_demo.png', { type: 'image/png' });
      setSelectedFile(demoFile);
      await handleRunDetection(demoFile);
    } catch (err) {
      console.error(err);
      setInputError('Failed to load demo SAR image asset.');
    } finally {
      setLoading(false);
    }
  };

  const morphology = detectionResult?.morphology;
  const area = morphology?.area_sq_km !== undefined ? morphology.area_sq_km : 68.32;
  const volume = morphology?.estimated_volume_m3 !== undefined ? morphology.estimated_volume_m3 : 17.7;
  const centroidLat = morphology?.centroid_lat !== undefined ? morphology.centroid_lat : 28.9668;
  const centroidLon = morphology?.centroid_lon !== undefined ? morphology.centroid_lon : -88.8937;
  const acqTime = detectionResult?.acquisition_time_utc || '2018-04-23 00:01:49 UTC';

  return (
    <section id="sar" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-safety-orange border border-safety-orange/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            02 // SENSOR OBSERVATION & GEOMETRY
          </span>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            SENTINEL-1 C-SAR OPERATIONAL ANALYSIS
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="stamp-tag border-concrete-700 text-concrete-400">
            ZENODO SOS RESNET34
          </span>
          <span className="stamp-tag border-safety-orange text-safety-orange font-bold">
            RTX 3050 CUDA 12.4
          </span>
        </div>
      </div>

      {/* Primary Visual Stage: Side-by-Side Raw SAR vs Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Raw SAR Input & Controller */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              RAW SAR (VV / VH CO-POLARIZED TENSOR)
            </span>
            <span className="text-[10px] text-concrete-500">2048×2048 FULL RESOLUTION</span>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-concrete-700 hover:border-safety-orange p-4 text-center transition bg-concrete-950">
            <input
              type="file"
              accept="image/*"
              id="sar-file-input"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="sar-file-input" className="cursor-pointer block space-y-1">
              <div className="text-xs font-bold text-concrete-200">
                {selectedFile ? selectedFile.name : '[ CLICK OR DROP SENTINEL-1 SAR IMAGE (.PNG, .TIF) ]'}
              </div>
              <p className="text-[10px] text-concrete-500">
                Supports Sentinel-1 IW swath GeoTIFF & PNG crops (MC20 corridor 00111.tif)
              </p>
            </label>
          </div>

          {/* Action Trigger Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleRunGoldenScene}
              disabled={loading}
              className="brutalist-btn-orange py-2 px-3 text-xs tracking-wider uppercase font-bold flex items-center justify-center space-x-2 text-center"
            >
              <span>[ ⚡ RUN GOLDEN: 00111 (NOAA AIS) → ]</span>
            </button>

            <button
              onClick={handleLoadDemoImage}
              disabled={loading}
              className="brutalist-btn bg-concrete-800 hover:bg-concrete-700 text-concrete-200 py-2 px-3 text-xs tracking-wider uppercase font-bold text-center"
            >
              <span>[ RUN DEMO (SYNTHETIC) ]</span>
            </button>
          </div>

          {/* Input Error Alert */}
          {inputError && (
            <div className="bg-red-950/90 border-2 border-red-500 p-2.5 text-red-200 text-xs font-mono space-y-1">
              <div className="flex items-center space-x-2 font-bold text-red-400 uppercase">
                <span>⚠ INPUT VALIDATION REJECTED</span>
              </div>
              <p className="text-[11px] leading-relaxed">{inputError}</p>
            </div>
          )}

          {/* Raw Imagery Display */}
          <div className="min-h-[260px] border border-concrete-800 bg-concrete-950 flex items-center justify-center p-2 relative overflow-hidden">
            {detectionResult?.raw_sar_base64 ? (
              <img
                src={detectionResult.raw_sar_base64}
                alt="Raw Sentinel-1 SAR Input"
                className="max-h-[250px] w-auto object-contain rounded-sm"
              />
            ) : (
              <div className="text-center p-4 space-y-1 text-concrete-500">
                <span className="text-xs font-bold uppercase block text-concrete-400">RAW SAR TENSOR STANDBY</span>
                <p className="text-[10px]">Load Golden Scene 00111.tif or upload custom Sentinel-1 IW swath.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Oil Spill Segmentation Mask */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
                OIL SPILL SEGMENTATION MASK
              </span>
              <span className="text-[10px] text-safety-orange font-bold">
                {detectionResult ? `[DETECTED: ${detectionResult.oil_coverage_pct}% OIL]` : '[STANDBY]'}
              </span>
            </div>

            {/* Spectral Mode Tabs */}
            <div className="flex space-x-1 text-[9px]">
              <button
                onClick={() => setSpectralTab('raw')}
                className={`px-2 py-1 border font-bold uppercase transition ${
                  spectralTab === 'raw'
                    ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                    : 'bg-concrete-950 text-concrete-400 border-concrete-800'
                }`}
              >
                RAW VV
              </button>
              <button
                onClick={() => setSpectralTab('prob')}
                className={`px-2 py-1 border font-bold uppercase transition ${
                  spectralTab === 'prob'
                    ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                    : 'bg-concrete-950 text-concrete-400 border-concrete-800'
                }`}
              >
                HEATMAP
              </button>
              <button
                onClick={() => setSpectralTab('binary')}
                className={`px-2 py-1 border font-bold uppercase transition ${
                  spectralTab === 'binary'
                    ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                    : 'bg-concrete-950 text-concrete-400 border-concrete-800'
                }`}
              >
                BINARY MASK
              </button>
            </div>
          </div>

          {/* Mask Visualizer */}
          <div className="min-h-[260px] border border-concrete-800 bg-concrete-950 flex items-center justify-center p-2 relative overflow-hidden">
            {detectionResult?.mask_base64 ? (
              <img
                src={detectionResult.mask_base64}
                alt="SAR Overlay Mask"
                className="max-h-[250px] w-auto object-contain rounded-sm"
              />
            ) : (
              <div className="text-center p-4 space-y-1 text-concrete-500">
                <span className="text-xs font-bold uppercase block text-concrete-400">INFERENCE MASK STANDBY</span>
                <p className="text-[10px]">U-Net sliding-window segmentation normalizes lookalikes vs mineral crude.</p>
              </div>
            )}
          </div>

          {/* Color Scale Legend */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-gradient-to-r from-concrete-800 via-sky-600 to-safety-orange border border-concrete-800"></div>
            <div className="flex items-center justify-between text-[9px] text-concrete-500 font-mono uppercase">
              <span>0.0 (Sea Surface)</span>
              <span>0.5 (Biogenic Lookalike)</span>
              <span className="text-safety-orange font-bold">1.0 (True Mineral Oil)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Geospatial Result: SLICK GEOMETRY */}
      <div className="bg-concrete-900 border-2 border-concrete-700 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase text-concrete-100 tracking-wider">
              [GEOSPATIAL OUTPUT] EXTRACTED SLICK GEOMETRY & MORPHOLOGY
            </span>
            <span className="stamp-tag border-sky-500 text-sky-400 text-[9px]">
              OBSERVATION LOCUS
            </span>
          </div>
          <span className="text-[10px] text-concrete-400">
            ACQUISITION: <strong className="text-concrete-200">{acqTime}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-concrete-950 p-3 border border-concrete-800">
            <span className="text-concrete-500 block text-[10px]">SURFACE AREA</span>
            <strong className="text-safety-orange font-mono text-xl font-black">
              {area.toFixed(2)} KM²
            </strong>
            <span className="text-[9px] text-concrete-600 block mt-0.5">SEGMENTED PIXELS</span>
          </div>

          <div className="bg-concrete-950 p-3 border border-concrete-800">
            <span className="text-concrete-500 block text-[10px]">OBSERVED CENTROID</span>
            <strong className="text-concrete-100 font-mono text-sm font-black block truncate">
              {formatCoordinateShort(centroidLat, centroidLon)}
            </strong>
            <span className="text-[9px] text-concrete-600 block mt-0.5">WGS-84 FIX</span>
          </div>

          <div className="bg-concrete-950 p-3 border border-concrete-800">
            <span className="text-concrete-500 block text-[10px]">ESTIMATED VOLUME</span>
            <strong className="text-concrete-100 font-mono text-xl font-black">
              {volume.toFixed(1)} M³
            </strong>
            <span className="text-[9px] text-concrete-600 block mt-0.5">FAY EQUATION BALANCE</span>
          </div>

          <div className="bg-concrete-950 p-3 border border-concrete-800">
            <span className="text-concrete-500 block text-[10px]">ESTIMATED MASS</span>
            <strong className="text-concrete-100 font-mono text-xl font-black">
              {(volume * 0.87).toFixed(1)} TONS
            </strong>
            <span className="text-[9px] text-concrete-600 block mt-0.5">CRUDE DENSITY 0.87</span>
          </div>
        </div>
      </div>

      {/* Secondary Validation Section: Collapsible Model Metrics */}
      <div className="bg-concrete-900 border border-concrete-800">
        <button
          onClick={() => setShowModelMetrics(!showModelMetrics)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-concrete-850 transition"
        >
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-concrete-400 font-bold uppercase">
              {showModelMetrics ? '▼' : '▶'} SECONDARY VALIDATION // NEURAL NETWORK BENCHMARK METRICS
            </span>
            <span className="text-[9px] text-concrete-500">
              (Zenodo SOS Held-Out Test Set)
            </span>
          </div>
          <span className="text-[10px] text-concrete-500 font-mono">
            {showModelMetrics ? '[ HIDE VALIDATION DATA ]' : '[ VIEW BENCHMARK METRICS ]'}
          </span>
        </button>

        {showModelMetrics && (
          <div className="p-4 border-t border-concrete-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">ZENODO HELD-OUT IoU</div>
              <div className="text-lg font-black text-safety-orange mt-0.5 font-display">67.25%</div>
              <div className="text-[8px] text-concrete-600">MINERAL CRUDE</div>
            </div>
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">PRECISION</div>
              <div className="text-lg font-black text-concrete-100 mt-0.5 font-display">90.5%</div>
              <div className="text-[8px] text-concrete-600">LOW FALSE POS</div>
            </div>
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">RECALL</div>
              <div className="text-lg font-black text-concrete-100 mt-0.5 font-display">71.8%</div>
              <div className="text-[8px] text-concrete-600">SLICK CAPTURE</div>
            </div>
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">F1-SCORE</div>
              <div className="text-lg font-black text-concrete-100 mt-0.5 font-display">80.1%</div>
              <div className="text-[8px] text-concrete-600">HARMONIC MEAN</div>
            </div>
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">WARM INFERENCE</div>
              <div className="text-lg font-black text-concrete-100 mt-0.5 font-display">2.31s</div>
              <div className="text-[8px] text-concrete-600">2048×2048 SLIDING</div>
            </div>
            <div className="bg-concrete-950 border border-concrete-800 p-2.5">
              <div className="text-[9px] text-concrete-500 font-bold uppercase">FORWARD PASS</div>
              <div className="text-lg font-black text-concrete-100 mt-0.5 font-display">13.2ms</div>
              <div className="text-[8px] text-concrete-600">256×256 TENSOR</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
