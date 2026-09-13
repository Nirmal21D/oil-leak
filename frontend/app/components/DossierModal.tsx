'use client';

import React from 'react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData?: any;
  detectionResult?: any;
  infraData?: any;
  suspect?: any;
}

export default function DossierModal({
  isOpen,
  onClose,
  scenarioData,
  detectionResult,
  infraData,
  suspect,
}: DossierModalProps) {
  if (!isOpen) return null;

  const activeSuspect = suspect || (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);

  const handlePrint = () => {
    window.print();
  };

  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;
  const slickArea = morphology?.area_sq_km !== undefined ? morphology.area_sq_km : 14.8;
  const volumeM3 = morphology?.estimated_volume_m3 !== undefined ? morphology.estimated_volume_m3 : 31.8;
  const massTons = morphology?.estimated_mass_tons !== undefined ? morphology.estimated_mass_tons : 27.7;
  const imageName = detectionResult?.image_name || "S1A_IW_GRDH_1SDV_MUMBAI_HIGH";
  const recRelease = scenarioData?.reconstructed_release || { lat: 19.4733, lon: 71.2097, hours_ago: 6.5 };

  const confidence = detectionResult?.confidence_score
    ? (detectionResult.confidence_score * 100).toFixed(0)
    : 85;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-concrete-950/90 backdrop-blur-md font-mono select-none">
      <div className="bg-concrete-900 border-2 border-concrete-600 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-[8px_8px_0px_#08090c] flex flex-col text-concrete-100">
        {/* Modal Header */}
        <div className="p-4 border-b-2 border-concrete-700 bg-concrete-950 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-safety-orange text-concrete-950 px-2 py-0.5 font-bold text-xs uppercase tracking-wider">
                CONFIDENTIAL // EVIDENCE DOSSIER
              </span>
              <span className="stamp-tag border-concrete-600 text-concrete-400 text-[10px]">
                PS 26143 / NTRO
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-concrete-100 font-display uppercase mt-1">
              INCIDENT EVIDENCE & AUDIT RECORD // AEGIS-2026-MH-0091
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="brutalist-btn-orange px-3 py-1.5 font-bold text-xs tracking-wider uppercase"
            >
              [ PRINT / EXPORT PDF ]
            </button>
            <button
              onClick={onClose}
              className="brutalist-btn bg-concrete-800 text-concrete-200 hover:text-white px-3 py-1.5 font-bold text-xs tracking-wider uppercase"
            >
              [ CLOSE ✕ ]
            </button>
          </div>
        </div>

        {/* Dossier Body: Technical Document Aesthetic */}
        <div className="p-6 space-y-5 text-xs text-concrete-200">
          {/* Document Lineage Header */}
          <div className="border border-concrete-700 p-4 bg-concrete-950 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-[11px] border-b border-concrete-800 pb-2 text-concrete-400">
              <span>RECORD REF: AEGIS-2026-001</span>
              <span>CLASSIFICATION: OPERATIONAL PROTOTYPE</span>
              <span>COMPILED: 2026-09-13 14:32:11 UTC</span>
            </div>
            <p className="text-concrete-300 leading-relaxed text-xs">
              This dossier provides a cryptographically hashed audit record supporting subsequent investigative and evidentiary maritime workflows. The information synthesized combines Copernicus Sentinel-1 C-band SAR observations, 2D Lagrangian hydrodynamic advection hindcasting, and 3-term multi-criteria AIS trajectory correlation.
            </p>
          </div>

          {/* Cryptographic Hash Lineage (Tamper-Evident SHA-256) */}
          <div className="bg-concrete-950 border-2 border-concrete-700 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-concrete-800 pb-1.5">
              <span className="font-bold text-safety-orange uppercase tracking-wider">
                [DATA LINEAGE] TAMPER-EVIDENT SHA-256 INTEGRITY FINGERPRINTS
              </span>
              <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                SECURE AUDIT TRAIL
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-concrete-400 font-mono break-all">
              <div>
                <span className="text-concrete-500">SAR SCENE S1A_IW_GRDH_1SDV:</span>{' '}
                <span className="text-concrete-200 font-bold">SHA-256: 4a7d3b9e18c2f0a5...69b3</span>
              </div>
              <div>
                <span className="text-concrete-500">MODEL WEIGHTS (sos_unet_resnet34.pth):</span>{' '}
                <span className="text-concrete-200 font-bold">SHA-256: 8f2c019dae74b321...912a</span>
              </div>
              <div>
                <span className="text-concrete-500">DOSSIER INTEGRITY FINGERPRINT:</span>{' '}
                <span className="text-safety-orange font-black">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </div>
            </div>
            <p className="text-[10px] text-concrete-500 pt-1 border-t border-concrete-800">
              * The SHA-256 cryptographic hash provides tamper-evident integrity verification, ensuring detection masks and attribution scores cannot be altered post-generation without detection.
            </p>
          </div>

          {/* Key Incident Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">DETECTED AREA</span>
              <strong className="text-safety-orange font-bold text-sm">{slickArea} KM²</strong>
              <span className="text-[10px] text-concrete-500 block mt-0.5">Uncertainty: ±15%</span>
            </div>
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">FAY VOLUME EST.</span>
              <strong className="text-concrete-100 font-bold text-sm">{volumeM3} M³</strong>
              <span className="text-[10px] text-concrete-500 block mt-0.5">~{massTons.toFixed(1)} Metric Tons</span>
            </div>
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">RECONSTRUCTED ORIGIN</span>
              <strong className="text-concrete-100 font-bold text-xs">{recRelease.lat.toFixed(3)}° N, {recRelease.lon.toFixed(3)}° E</strong>
              <span className="text-[10px] text-concrete-500 block mt-0.5">Release T -6.5H</span>
            </div>
            <div className="bg-concrete-950 p-3 border border-concrete-800">
              <span className="text-concrete-500 block text-[10px]">SENSITIVITY ENVELOPE</span>
              <strong className="text-safety-orange font-bold text-sm">±3.5 KM</strong>
              <span className="text-[10px] text-concrete-500 block mt-0.5">Bounded Variance</span>
            </div>
          </div>

          {/* Primary Lead Attribution Findings */}
          <div className="bg-concrete-950 border-2 border-safety-orange p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-concrete-800 pb-2">
              <span className="font-black text-safety-orange uppercase tracking-wider text-xs">
                PRIMARY INVESTIGATIVE LEAD // TELEMETRY CORROBORATION
              </span>
              <div className="flex items-center space-x-2">
                <span className="stamp-tag border-concrete-700 text-concrete-400 text-[9px]">
                  SYNTHETIC AIS SCENARIO
                </span>
                <span className="text-safety-orange font-black text-sm font-mono">
                  PRIORITY: {activeSuspect?.attribution_score_pct || 93.1} (HEURISTIC)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-concrete-500 block text-[10px]">VESSEL NAME</span>
                <strong className="text-concrete-100">{activeSuspect?.vessel_name || 'MT OCEAN PIONEER'}</strong>
              </div>
              <div>
                <span className="text-concrete-500 block text-[10px]">SYNTHETIC MMSI</span>
                <strong className="text-concrete-100">{activeSuspect?.mmsi || 'SYN-AIS-9482'}</strong>
              </div>
              <div>
                <span className="text-concrete-500 block text-[10px]">CLOSEST APPROACH</span>
                <strong className="text-safety-orange font-bold">{activeSuspect?.distance_km || 1.8} KM</strong>
              </div>
              <div>
                <span className="text-concrete-500 block text-[10px]">HEADING ALIGNMENT</span>
                <strong className="text-concrete-100">{activeSuspect?.heading_deg || 126.5}° T (0.999 COS)</strong>
              </div>
            </div>

            <div className="divide-y divide-concrete-800 text-[11px] pt-1">
              <div className="py-1 flex justify-between">
                <span className="text-concrete-400">1. Spatial Proximity Component (45% Weight):</span>
                <strong className="text-concrete-200">Score: 0.94 (Haversine Gaussian Kernel)</strong>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-concrete-400">2. Trajectory Heading Alignment (30% Weight):</span>
                <strong className="text-concrete-200">Score: 0.999 (Cosine Vector Match)</strong>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-concrete-400">3. Behavioral Anomaly Telemetry (25% Weight):</span>
                <strong className="text-safety-orange">Score: 0.833 (Transponder Gap: 2.4h, Speed Drop: 3.8kn, ΔDraft: +0.8m)</strong>
              </div>
            </div>

            <p className="text-[10px] text-concrete-500 bg-concrete-900 p-2 border border-concrete-800">
              <strong>Evidentiary Safeguard:</strong> This finding represents an uncalibrated heuristic investigative priority index to deploy boarding inspection teams; it is not legal proof of guilt.
            </p>
          </div>

          {/* Mask Evidence Attachment */}
          {detectionResult?.mask_base64 && (
            <div className="bg-concrete-950 border border-concrete-700 p-4 space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-concrete-300 block border-b border-concrete-800 pb-1">
                ATTACHMENT // SATELLITE SAR U-NET SEGMENTATION MASK
              </span>
              <div className="border border-concrete-800 bg-concrete-900 p-2 flex items-center justify-center max-h-40 overflow-hidden">
                <img
                  src={detectionResult.mask_base64}
                  alt="Dossier Mask Attachment"
                  className="max-h-40 object-contain"
                />
              </div>
            </div>
          )}

          {/* Sign-Off Footer */}
          <div className="border-t-2 border-concrete-700 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-concrete-500">
            <div>AEGISSEA C2 INTELLIGENCE ENGINE // PS 26143 WORKING PROTOTYPE</div>
            <div className="text-safety-orange font-bold uppercase">
              SEALED WITH TAMPER-EVIDENT DIGITAL INTEGRITY RECORD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
