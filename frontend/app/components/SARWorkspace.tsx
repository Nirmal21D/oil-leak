'use client';

import React, { useState } from 'react';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Immediately run detection on the user's uploaded file
      handleRunDetection(file);
    }
  };

  const handleRunDetection = async (overrideFile?: File) => {
    const fileToRun = overrideFile || selectedFile;
    if (!fileToRun) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileToRun);

    try {
      const res = await fetch('http://localhost:8000/api/v1/detect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Detection failed');
      const data = await res.json();
      if (onDetectionComplete) onDetectionComplete(data);
    } catch (err) {
      alert('Failed to connect to GPU backend engine. Is FastAPI running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoImage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/sentinel_demo.png');
      const blob = await res.blob();
      const demoFile = new File([blob], 'sentinel_1_mumbai_high_sar.png', { type: 'image/png' });
      setSelectedFile(demoFile);
      await handleRunDetection(demoFile);
    } catch (e) {
      console.error('Failed to load demo SAR image:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="sar" className="bg-concrete-950 border-2 border-concrete-700 p-5 font-mono select-none text-concrete-100 space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-concrete-700 pb-3">
        <div className="flex items-center space-x-3">
          <span className="bg-concrete-900 text-safety-orange border border-concrete-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
            02 // SAR SCIENTIFIC PIPELINE
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-tight text-concrete-100 font-display">
            HIGH-RESOLUTION RESNET34 U-NET SEGMENTATION WORKSPACE
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="stamp-tag border-concrete-600 text-concrete-300">
            ZENODO SOS PARTITION
          </span>
          <span className="stamp-tag border-safety-orange text-safety-orange font-bold">
            RTX 3050 CUDA 12.4
          </span>
        </div>
      </div>

      {/* Verified Model Evaluation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">ZENODO HELD-OUT IoU</div>
          <div className="text-xl sm:text-2xl font-black text-safety-orange mt-1 font-display">67.25%</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">MINERAL CRUDE</div>
        </div>
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">PRECISION</div>
          <div className="text-xl sm:text-2xl font-black text-concrete-100 mt-1 font-display">90.5%</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">LOW FALSE POS</div>
        </div>
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">RECALL</div>
          <div className="text-xl sm:text-2xl font-black text-concrete-100 mt-1 font-display">71.8%</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">SLICK CAPTURE</div>
        </div>
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">F1-SCORE</div>
          <div className="text-xl sm:text-2xl font-black text-concrete-100 mt-1 font-display">80.1%</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">HARMONIC MEAN</div>
        </div>
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">WARM INFERENCE</div>
          <div className="text-xl sm:text-2xl font-black text-concrete-100 mt-1 font-display">2.31s</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">2048×2048 SLIDING</div>
        </div>
        <div className="bg-concrete-900 border border-concrete-800 p-3">
          <div className="text-[10px] text-concrete-500 font-bold uppercase">TILE FORWARD PASS</div>
          <div className="text-xl sm:text-2xl font-black text-concrete-100 mt-1 font-display">13.2ms</div>
          <div className="text-[9px] text-concrete-600 mt-0.5">256×256 TENSOR</div>
        </div>
      </div>

      {/* Before / After Scientific Visual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Left: Input SAR Imagery & File Controller */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              [STAGE 1] RAW SAR INPUT (VV/VH 3-CHANNEL TENSOR)
            </span>
            <span className="text-[10px] text-concrete-500">256×256 CROP / 2048×2048 FULL</span>
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
                Supports Sentinel-1 IW swath GeoTIFF & PNG crops (median oil coverage 11.3%)
              </p>
            </label>
          </div>

          {/* Action Trigger Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleLoadDemoImage}
              disabled={loading}
              className="brutalist-btn-orange py-2 px-3 text-xs tracking-wider uppercase font-bold flex items-center justify-center space-x-2 text-center"
            >
              <span>[ ⚡ RUN PRESET SENTINEL-1 SAR PASS → ]</span>
            </button>

            {selectedFile && (
              <button
                onClick={() => handleRunDetection()}
                disabled={loading}
                className="brutalist-btn bg-concrete-800 hover:bg-concrete-700 text-concrete-100 py-2 px-3 text-xs tracking-wider uppercase font-bold text-center"
              >
                {loading ? 'PROCESSING GPU INFERENCE (~2.3s)...' : '[ RE-EXECUTE U-NET MODEL ]'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Model Output & Spectral Masks */}
        <div className="bg-concrete-900 border border-concrete-700 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-concrete-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-concrete-200">
              [STAGE 2] U-NET SEMANTIC OUTPUT & SPECTRAL MASKS
            </span>
            <span className="text-[10px] text-safety-orange font-bold">
              {detectionResult ? `DETECTED: ${detectionResult.oil_coverage_pct}% OIL` : 'AWAITING RUN'}
            </span>
          </div>

          {/* Spectral Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              onClick={() => setSpectralTab('raw')}
              className={`py-1.5 border font-bold uppercase transition ${
                spectralTab === 'raw'
                  ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              RAW VV (dB)
            </button>
            <button
              onClick={() => setSpectralTab('prob')}
              className={`py-1.5 border font-bold uppercase transition ${
                spectralTab === 'prob'
                  ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              U-NET PROB HEATMAP
            </button>
            <button
              onClick={() => setSpectralTab('binary')}
              className={`py-1.5 border font-bold uppercase transition ${
                spectralTab === 'binary'
                  ? 'bg-concrete-100 text-concrete-950 border-concrete-100'
                  : 'bg-concrete-950 text-concrete-400 border-concrete-800 hover:text-concrete-200'
              }`}
            >
              BINARY THRESHOLD
            </button>
          </div>

          {/* Mask Visualizer Container */}
          <div className="h-32 border-2 border-concrete-700 bg-concrete-950 overflow-hidden flex items-center justify-center relative">
            {detectionResult?.mask_base64 ? (
              <img
                src={detectionResult.mask_base64}
                alt="SAR Overlay Mask"
                className={`h-full object-contain ${
                  spectralTab === 'raw'
                    ? 'filter grayscale contrast-150 brightness-90'
                    : spectralTab === 'binary'
                    ? 'filter contrast-200 grayscale invert'
                    : 'filter hue-rotate-15'
                }`}
              />
            ) : (
              <div className="text-center p-3">
                <span className="text-xs font-bold text-concrete-400 uppercase">
                  READY FOR SAR TENSOR INPUT
                </span>
                <p className="text-[10px] text-concrete-600 mt-1">
                  Sliding-window (stride 128, 50% overlap) normalizes seamless boundary stitches
                </p>
              </div>
            )}
          </div>

          {/* Color Scale Legend */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-gradient-to-r from-concrete-800 via-sky-600 to-safety-orange border border-concrete-700"></div>
            <div className="flex items-center justify-between text-[9px] text-concrete-500 font-mono uppercase">
              <span>0.0 (Sea Water)</span>
              <span>0.5 (Biogenic Lookalike)</span>
              <span className="text-safety-orange font-bold">1.0 (True Mineral Oil)</span>
            </div>
          </div>

          {/* Live Detection Results Summary */}
          {detectionResult && (
            <div className="bg-concrete-950 border-2 border-safety-orange/50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-concrete-800 pb-1.5">
                <span className="font-bold text-[10px] text-safety-orange uppercase tracking-wider">
                  [LIVE] DETECTION RESULTS — {detectionResult.image_name}
                </span>
                <span className="stamp-tag border-safety-orange text-safety-orange text-[9px]">
                  {detectionResult.width}×{detectionResult.height} PX
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-concrete-900 p-2 border border-concrete-800">
                  <span className="text-concrete-500 block">OIL PIXELS</span>
                  <strong className="text-safety-orange font-mono text-xs">
                    {detectionResult.oil_pixel_count?.toLocaleString()} ({detectionResult.oil_coverage_pct}%)
                  </strong>
                </div>
                <div className="bg-concrete-900 p-2 border border-concrete-800">
                  <span className="text-concrete-500 block">AREA</span>
                  <strong className="text-concrete-100 font-mono text-xs">
                    {detectionResult.morphology?.area_sq_km?.toFixed(2)} KM²
                  </strong>
                </div>
                <div className="bg-concrete-900 p-2 border border-concrete-800">
                  <span className="text-concrete-500 block">VOLUME</span>
                  <strong className="text-concrete-100 font-mono text-xs">
                    {detectionResult.morphology?.estimated_volume_m3?.toFixed(1)} M³
                  </strong>
                </div>
                <div className="bg-concrete-900 p-2 border border-concrete-800">
                  <span className="text-concrete-500 block">PERIMETER</span>
                  <strong className="text-concrete-100 font-mono text-xs">
                    {detectionResult.morphology?.perimeter_km?.toFixed(1)} KM
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
