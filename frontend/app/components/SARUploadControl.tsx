'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Cpu, Satellite, CheckCircle2, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { formatDataUrl } from '../utils/geo';

interface SARUploadControlProps {
  onDetectionComplete?: (result: any) => void;
}

export default function SARUploadControl({ onDetectionComplete }: SARUploadControlProps) {
  const [activeTab, setActiveTab] = useState<'zenodo' | 'upload'>('zenodo');
  const [selectedCategory, setSelectedCategory] = useState<'oil' | 'lookalike' | 'no_oil'>('oil');
  const [availableScenes, setAvailableScenes] = useState<Record<string, any[]>>({ oil: [], lookalike: [], no_oil: [] });
  const [selectedSceneId, setSelectedSceneId] = useState<string>('00000');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // Fetch available real Sentinel-1 scenes from the Zenodo dataset via backend
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/dataset/scenes')
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.oil || data.lookalike || data.no_oil)) {
          setAvailableScenes(data);
          if (data.oil && data.oil.length > 0) {
            setSelectedSceneId(data.oil[0].scene_id);
          }
        }
      })
      .catch((err) => console.error('Failed to load dataset scenes:', err));
  }, []);

  const handleCategoryChange = (cat: 'oil' | 'lookalike' | 'no_oil') => {
    setSelectedCategory(cat);
    const list = availableScenes[cat] || [];
    if (list.length > 0) {
      setSelectedSceneId(list[0].scene_id);
    }
  };

  const handleAnalyzeZenodoScene = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/dataset/analyze-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          scene_id: selectedSceneId,
        }),
      });

      if (!res.ok) throw new Error('Scene analysis failed');
      const data = await res.json();
      setDetectionResult(data);
      if (onDetectionComplete) onDetectionComplete(data);
    } catch (err) {
      alert('Error running UNet on real Sentinel-1 scene. Check if backend is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDetectionResult(null);
    }
  };

  const handleRunCustomUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8000/api/v1/detect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Detection failed');
      const data = await res.json();
      setDetectionResult(data);
      if (onDetectionComplete) onDetectionComplete(data);
    } catch (err) {
      alert('Failed to connect to GPU backend engine.');
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryScenes = availableScenes[selectedCategory] || [];

  return (
    <div className="bg-[#111622] border border-[#232d45] rounded-xl p-4 space-y-4 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c2438] pb-2.5">
        <div className="flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            SENTINEL-1 SAR INTELLIGENCE HUB
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#161d2d] text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          RTX 3050 GPU ACCELERATED
        </span>
      </div>

      {/* Ingestion Mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#0b0e14] p-1 rounded-lg border border-[#1c2438]">
        <button
          onClick={() => setActiveTab('zenodo')}
          className={`py-1.5 px-3 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'zenodo'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ZENODO S-1 BENCHMARK</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`py-1.5 px-3 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'upload'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>TACTICAL UPLOAD</span>
        </button>
      </div>

      {/* TAB 1: ZENODO REAL BENCHMARK */}
      {activeTab === 'zenodo' && (
        <div className="space-y-3">
          {/* Category Pills */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Satellite Scene Class
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleCategoryChange('oil')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded border transition text-center ${
                  selectedCategory === 'oil'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-[#161d2d] border-[#232d45] text-slate-400 hover:border-slate-600'
                }`}
              >
                🛢️ OIL SPILL
              </button>
              <button
                onClick={() => handleCategoryChange('lookalike')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded border transition text-center ${
                  selectedCategory === 'lookalike'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#161d2d] border-[#232d45] text-slate-400 hover:border-slate-600'
                }`}
              >
                🌊 LOOKALIKE
              </button>
              <button
                onClick={() => handleCategoryChange('no_oil')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded border transition text-center ${
                  selectedCategory === 'no_oil'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-[#161d2d] border-[#232d45] text-slate-400 hover:border-slate-600'
                }`}
              >
                🟦 CLEAN SEA
              </button>
            </div>
          </div>

          {/* Scene Selector Dropdown */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Select Sentinel-1 SAR Scene
              </span>
              <span className="text-[9px] text-sky-400">
                {currentCategoryScenes.length} scenes indexed
              </span>
            </div>
            <select
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              className="w-full bg-[#161d2d] border border-[#232d45] text-slate-200 text-xs rounded-lg p-2 font-mono focus:border-sky-400 focus:outline-none"
            >
              {currentCategoryScenes.map((s) => (
                <option key={s.scene_id} value={s.scene_id}>
                  Scene #{s.scene_id} ({s.filename}) {s.has_mask ? '— Ground Truth Mask ✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyzeZenodoScene}
            disabled={loading || currentCategoryScenes.length === 0}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 shadow disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Sliding-Window UNet on GPU...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>⚡ ANALYZE SENTINEL-1 GEO-TIFF</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: MANUAL TACTICAL UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div className="border border-dashed border-[#2c3754] hover:border-sky-400 rounded-xl p-4 text-center transition bg-[#161d2d]">
            <input
              type="file"
              accept="image/*"
              id="sar-file-input"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="sar-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
              <Upload className="w-6 h-6 text-sky-400" />
              <p className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : 'Drag & Drop Tactical SAR Image (.tif, .png)'}
              </p>
              <span className="text-[10px] text-slate-500">Supports dual-pol 2048×2048 float32 TIFF</span>
            </label>
          </div>

          {selectedFile && (
            <button
              onClick={handleRunCustomUpload}
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 shadow disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Tactical Feed...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Custom U-Net Inference</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Results HUD */}
      {detectionResult && (
        <div className="space-y-3 pt-3 border-t border-[#1c2438]">
          {/* Ground Truth Validation Badge */}
          {detectionResult.ground_truth_metrics && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2.5 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>ZENODO GROUND TRUTH VALIDATED</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/30">
                    IoU: {detectionResult.ground_truth_metrics.iou_score}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Ground truth mask matches {detectionResult.ground_truth_metrics.intersection_pixels.toLocaleString()} pixels.
                </p>
              </div>
            </div>
          )}

          {/* Radar Radiometric Stats */}
          {detectionResult.radar_metadata && (
            <div className="bg-[#0b0e14] p-2 rounded-lg border border-[#1c2438] text-[10px] flex justify-between text-slate-400">
              <span>VV Backscatter: <strong className="text-sky-300">{detectionResult.radar_metadata.vv_mean_db?.toFixed(1)} dB</strong></span>
              <span>VH Cross-Pol: <strong className="text-sky-300">{detectionResult.radar_metadata.vh_mean_db?.toFixed(1)} dB</strong></span>
              <span>Raw: <strong className="text-slate-200">2048×2048</strong></span>
            </div>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Slick Coverage</div>
              <div className="text-sm font-bold text-red-400 font-mono">{detectionResult.oil_coverage_pct}%</div>
            </div>
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Lookalike Damping</div>
              <div className="text-sm font-bold text-amber-400 font-mono">{detectionResult.lookalike_coverage_pct}%</div>
            </div>
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Model Confidence</div>
              <div className="text-sm font-bold text-sky-400 font-mono">
                {(detectionResult.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Segmentation Mask Display */}
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>U-Net Multi-Class Overlay</span>
              <span className="text-slate-300 text-[10px] font-medium">
                {detectionResult.scene_info?.filename || detectionResult.image_name}
              </span>
            </div>
            <div className="rounded-lg overflow-hidden border border-[#232d45] max-h-48 flex items-center justify-center bg-[#0b0e14]">
              <img src={formatDataUrl(detectionResult.mask_base64)} alt="U-Net Mask" className="object-contain max-h-48" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
