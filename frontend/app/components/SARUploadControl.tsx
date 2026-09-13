'use client';

import React, { useState } from 'react';
import { Upload, Sparkles, Cpu, Satellite } from 'lucide-react';

interface SARUploadControlProps {
  onDetectionComplete?: (result: any) => void;
}

export default function SARUploadControl({ onDetectionComplete }: SARUploadControlProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDetectionResult(null);
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
      setDetectionResult(data);
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
    <div className="bg-[#111622] border border-[#232d45] rounded-xl p-4 space-y-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1c2438] pb-2.5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">GPU SAR DETECTION ENGINE</h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#161d2d] text-slate-300 border border-[#232d45] font-medium">
          RTX 3050 READY
        </span>
      </div>

      {/* File Upload Zone */}
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
            {selectedFile ? selectedFile.name : 'Click or Drag Sentinel-1 SAR Image (.png, .jpg, .tif)'}
          </p>
          <span className="text-[10px] text-slate-500">Supports 2048×2048 sliding-window GPU inference</span>
        </label>
      </div>

      {/* Demo Preset & Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleLoadDemoImage}
          disabled={loading}
          className="w-full py-2 px-3 bg-[#1c2438] hover:bg-[#232d45] text-sky-300 border border-sky-500/30 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 uppercase tracking-wider"
        >
          <Satellite className="w-4 h-4 text-sky-400" />
          <span>⚡ RUN PRESET SENTINEL-1 SAR PASS</span>
        </button>

        {selectedFile && (
          <button
            onClick={() => handleRunDetection()}
            disabled={loading}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 shadow disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Running GPU U-Net Inference (~2s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Re-Run GPU Segmentation</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Detection Results Overlay */}
      {detectionResult && (
        <div className="space-y-3 pt-2 border-t border-[#1c2438]">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Slick Coverage</div>
              <div className="text-sm font-bold text-red-400 font-mono">{detectionResult.oil_coverage_pct}%</div>
            </div>
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Sea Background</div>
              <div className="text-sm font-bold text-slate-300 font-mono">
                {(100 - detectionResult.oil_coverage_pct).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#161d2d] p-2 rounded border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">GPU Model Conf.</div>
              <div className="text-sm font-bold text-sky-400 font-mono">
                {(detectionResult.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Mask Base64 Preview */}
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>U-Net Segmentation Mask</span>
              <span className="text-slate-300 text-[10px] font-medium">High Resolution Mask</span>
            </div>
            <div className="rounded-lg overflow-hidden border border-[#232d45] max-h-48 flex items-center justify-center bg-[#0b0e14]">
              <img src={detectionResult.mask_base64} alt="U-Net Mask" className="object-contain max-h-48" />
            </div>
            <p className="text-[9px] text-slate-500 font-mono text-center pt-1">
              * Zenodo SOS 256×256 Oil Core Crop: Ground Truth annotation is 79.7% oil; U-Net segmented 84.0% oil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
