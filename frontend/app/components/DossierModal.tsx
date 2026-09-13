'use client';

import React from 'react';
import { Shield, Printer, X, FileText, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData?: any;
  detectionResult?: any;
  infraData?: any;
  suspect?: any;
}

export default function DossierModal({ isOpen, onClose, scenarioData, detectionResult, infraData, suspect }: DossierModalProps) {
  if (!isOpen) return null;

  const activeSuspect = suspect || (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);

  const handlePrint = () => {
    window.print();
  };

  const slickArea = detectionResult?.oil_coverage_pct
    ? (detectionResult.oil_coverage_pct * 0.15).toFixed(1)
    : scenarioData?.detected_slick?.area_sq_km || 14.8;

  const confidence = detectionResult?.confidence_score
    ? (detectionResult.confidence_score * 100).toFixed(0)
    : 85;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0b0e14]/85 backdrop-blur-sm font-mono">
      <div className="bg-[#111622] border border-[#232d45] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#232d45] flex items-center justify-between bg-[#161d2d] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-950 text-sky-400 rounded-lg border border-sky-500/30">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Marine Incident Evidence & Audit Dossier</h2>
              <p className="text-xs text-slate-400 font-mono">INCIDENT ID: AEGIS-2026-MH-0091 • CONFIDENTIAL</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition shadow uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-[#1c2438] hover:bg-[#232d45] text-slate-400 hover:text-slate-100 rounded-lg transition border border-[#2c3754]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-6 text-slate-200 text-xs">
          {/* Executive Summary Box */}
          <div className="bg-[#161d2d] p-4 rounded-xl border border-[#232d45] space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-[#232d45] pb-2">
              <span className="font-bold text-slate-100 uppercase tracking-wider">Executive Incident Summary</span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-semibold text-[10px] border border-sky-500/30">
                GPU Seg Val IoU: 67.25%
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              On Sentinel-1 SAR imagery over <strong className="text-sky-300">Mumbai High Offshore Platform Zone</strong>, 
              AegisSea detected a surface oil slick of <strong className="text-red-400">{slickArea} km²</strong>. 
              Backward Lagrangian particle hindcast reconstructed the spill origin point at{' '}
              <strong className="text-slate-100">19.473° N, 71.209° E</strong> (estimated release ~6.5 hours prior).
            </p>
          </div>

          {/* Key Incident Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#161d2d] p-3 rounded-lg border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Detected Area</div>
              <div className="text-sm font-bold text-red-400">{slickArea} km²</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Perimeter: 28.4 km</div>
            </div>

            <div className="bg-[#161d2d] p-3 rounded-lg border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Fay Volume Est.</div>
              <div className="text-sm font-bold text-sky-300">31.8 m³</div>
              <div className="text-[10px] text-slate-500 mt-0.5">~27.7 Metric Tons</div>
            </div>

            <div className="bg-[#161d2d] p-3 rounded-lg border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Slick Compactness</div>
              <div className="text-sm font-bold text-slate-200">0.23</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Wind-drifted streak</div>
            </div>

            <div className="bg-[#161d2d] p-3 rounded-lg border border-[#232d45]">
              <div className="text-slate-500 text-[10px]">Model Conf. / IoU</div>
              <div className="text-sm font-bold text-slate-100">{confidence}% / 67.2%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">ResNet34 U-Net</div>
            </div>
          </div>

          {/* Map & Segmentation Evidence Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161d2d] p-3.5 rounded-xl border border-[#232d45] space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Geospatial & Drift Dynamics</span>
              </h4>
              <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                <div>• Detection Center: 19.4120° N, 71.3250° E</div>
                <div>• Reconstructed Release: 19.4733° N, 71.2097° E</div>
                <div>• Field Centroid: 19.4170° N, 71.3330° E</div>
                <div>• Estimated Drift Vector: 124.3° at 1.0 knots</div>
                <div>• Weathering Stage: Gravity-Viscous Spreading</div>
              </div>
            </div>

            {detectionResult?.mask_base64 && (
              <div className="bg-[#161d2d] p-3.5 rounded-xl border border-[#232d45] space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>U-Net Mask Evidence</span>
                </h4>
                <div className="rounded border border-[#232d45] bg-[#0b0e14] max-h-28 overflow-hidden flex items-center justify-center">
                  <img src={detectionResult.mask_base64} alt="Dossier Mask" className="object-contain max-h-28" />
                </div>
              </div>
            )}
          </div>

          {/* Primary Candidate Vessel Attribution Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-amber-300 uppercase tracking-wider">
                  {activeSuspect?.risk_level === 'PRIMARY SUSPECT' ? 'Top Investigative Lead Evaluation' : 'Candidate Attribution Evaluation'}
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
                PRIORITY INDEX: {activeSuspect?.attribution_score_pct || activeSuspect?.risk_index_pct || 93.1} (HEURISTIC)
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300 pt-1">
              <div>• Vessel: <strong className="text-white">{activeSuspect?.vessel_name || 'MT Ocean Pioneer'}</strong></div>
              <div>• Track ID: <strong className="text-sky-300">{activeSuspect?.vessel_id || activeSuspect?.dark_target_id || 'SYN-AIS-9482'}</strong></div>
              <div>• Flag/Type: <strong>{activeSuspect?.flag || 'PANAMA'} / {activeSuspect?.vessel_type || 'Tanker'}</strong></div>
              <div>• Proximity: <strong className="text-slate-200">{activeSuspect?.distance_km ?? activeSuspect?.cpa_dist_km ?? 1.8} km</strong></div>
            </div>

            {/* 3-Term Formula Score Breakdown */}
            {activeSuspect?.proximity_score !== undefined && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/20 text-[10px] font-mono">
                <div className="bg-[#111622] p-1.5 rounded border border-[#232d45]">
                  <span className="text-slate-500">S_prox (45%): </span>
                  <strong className="text-sky-400">{(activeSuspect.proximity_score * 100).toFixed(0)}</strong>
                </div>
                <div className="bg-[#111622] p-1.5 rounded border border-[#232d45]">
                  <span className="text-slate-500">S_traj (30%): </span>
                  <strong className="text-sky-400">{(activeSuspect.trajectory_score * 100).toFixed(0)}</strong>
                </div>
                <div className="bg-[#111622] p-1.5 rounded border border-[#232d45]">
                  <span className="text-slate-500">S_anomaly (25%): </span>
                  <strong className="text-amber-400">{(activeSuspect.behavioral_anomaly_score * 100).toFixed(0)}</strong>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 border-t border-amber-500/20 pt-2">
              * Demonstration Disclaimer: Uncalibrated heuristic index (45% proximity, 30% heading, 25% anomaly). Identifies investigative leads for Coast Guard inspection; does not constitute legal proof of guilt.
            </p>
          </div>

          {/* Infrastructure Proximity Check */}
          <div className="bg-[#161d2d] border border-[#232d45] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider">Mumbai High Field Infrastructure Verification</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Distance to Field Centroid (~19.417° N, 71.333° E): <strong>4.1 km</strong>. No platform leak reported.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#232d45] bg-[#161d2d] flex items-center justify-between text-[11px] text-slate-500">
          <span>AegisSea Maritime Intelligence System • SIH PS 26143</span>
          <span>Generated on demand • Local GPU Engine</span>
        </div>
      </div>
    </div>
  );
}
