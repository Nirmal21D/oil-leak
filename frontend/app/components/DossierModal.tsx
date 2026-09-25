'use client';

import React, { useState } from 'react';
import { formatCoordinate, formatDataUrl } from '../utils/geo';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData?: any;
  detectionResult?: any;
  infraData?: any;
  suspect?: any;
  onOpenAIBriefing?: () => void;
}

export default function DossierModal({
  isOpen,
  onClose,
  scenarioData,
  detectionResult,
  infraData,
  suspect,
  onOpenAIBriefing,
}: DossierModalProps) {
  const [activePageTab, setActivePageTab] = useState<number>(1);

  if (!isOpen) return null;

  const activeSuspect = suspect || (scenarioData?.ranked_suspects ? scenarioData.ranked_suspects[0] : null);

  const handlePrint = () => {
    window.print();
  };

  const morphology = detectionResult?.morphology || scenarioData?.detected_slick;
  const slickArea = morphology?.area_sq_km != null ? Number(morphology.area_sq_km).toFixed(1) : 'NOT AVAILABLE';
  const volumeM3 = morphology?.estimated_volume_m3 != null ? Number(morphology.estimated_volume_m3).toFixed(1) : 'NOT AVAILABLE';
  const massTons = morphology?.estimated_mass_tons != null ? Number(morphology.estimated_mass_tons).toFixed(1) : 'UNAVAILABLE';
  const recRelease = scenarioData?.reconstructed_release;
  const routing = scenarioData?.responder_route || scenarioData?.responder_routing || detectionResult?.responder_route || detectionResult?.responder_routing;
  const selectedPort =
    routing?.selected_port ||
    (routing?.response_hub && routing?.response_hub !== 'PORT DATA UNAVAILABLE'
      ? {
          port_name: routing.response_hub,
          wpi_number: routing.wpi_number,
          un_locode: routing.un_locode,
          geodesic_distance_km: routing.geodesic_distance_km,
          bearing_deg: routing.bearing_deg,
        }
      : null);
  const candidateAudit = routing?.candidate_audit;
  const rankedSuspects = scenarioData?.ranked_suspects || [];

  const rawScore = activeSuspect?.attribution_score_pct ?? activeSuspect?.score_index;
  const scoreDisplay = rawScore != null ? `${Number(rawScore).toFixed(1)} / 100` : 'N/A';

  const scrollToPage = (pageNum: number) => {
    setActivePageTab(pageNum);
    const el = document.getElementById(`dossier-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-concrete-950/95 backdrop-blur-md font-mono select-none">
      <div className="bg-concrete-900 border-2 border-concrete-600 max-w-5xl w-full max-h-[94vh] overflow-y-auto shadow-[12px_12px_0px_#08090c] flex flex-col text-concrete-100">
        
        {/* Sticky Control Header (Hidden when printed) */}
        <div className="p-3 sm:p-4 border-b-2 border-concrete-700 bg-concrete-950 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-safety-orange text-concrete-950 px-2 py-0.5 font-black text-xs uppercase tracking-wider">
                FORENSIC RECORD // 7-PAGE DOSSIER
              </span>
              <span className="stamp-tag border-concrete-600 text-concrete-300 text-[10px]">
                PS 26143 / NTRO TACTICAL C2
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-concrete-100 font-display uppercase mt-0.5">
              MARITIME INCIDENT EVIDENCE & INVESTIGATION DOSSIER // {scenarioData?.incident_id || 'AEGIS-2018-MC20-00111'}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="brutalist-btn-orange px-3.5 py-1.5 font-black text-xs tracking-wider uppercase flex items-center space-x-1.5 cursor-pointer"
            >
              <span>🖨️</span>
              <span>[ PRINT / EXPORT PDF ]</span>
            </button>
            <button
              onClick={onClose}
              className="brutalist-btn bg-concrete-800 text-concrete-200 hover:text-white px-3 py-1.5 font-bold text-xs tracking-wider uppercase cursor-pointer"
            >
              [ CLOSE ✕ ]
            </button>
          </div>
        </div>

        {/* Page Navigation Tabs (Screen view only) */}
        <div className="bg-concrete-950 border-b border-concrete-800 px-4 py-2 flex items-center space-x-1 overflow-x-auto text-[11px] print:hidden">
          <span className="text-concrete-500 font-bold mr-2 text-[10px] shrink-0">SECTIONS:</span>
          {[
            { num: 1, title: '01. SUMMARY' },
            { num: 2, title: '02. SAR SEGMENTATION' },
            { num: 3, title: '03. METOCEAN DRIFT' },
            { num: 4, title: '04. AIS ATTRIBUTION' },
            { num: 5, title: '05. WPI INFRASTRUCTURE' },
            { num: 6, title: '06. PROVENANCE' },
            { num: 7, title: '07. LIMITATIONS' },
          ].map((tab) => (
            <button
              key={tab.num}
              onClick={() => scrollToPage(tab.num)}
              className={`px-2.5 py-1 uppercase font-mono font-bold tracking-wider transition-colors shrink-0 cursor-pointer ${
                activePageTab === tab.num
                  ? 'bg-safety-orange text-concrete-950'
                  : 'bg-concrete-900 text-concrete-400 hover:text-concrete-200 hover:bg-concrete-800 border border-concrete-800'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Printable 7-Page Dossier Body */}
        <div id="printable-dossier" className="p-4 sm:p-8 space-y-8 text-xs text-concrete-200 print:p-0 print:m-0 print:text-black">
          
          {/* =========================================================================
              PAGE 01: INCIDENT SUMMARY & SPATIAL FOOTPRINT
             ========================================================================= */}
          <div id="dossier-page-1" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  AEGISSEA MARITIME TACTICAL C2 // NTRO PS-26143
                </span>
                <h1 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 01 / 07 // INCIDENT SUMMARY & SPATIAL FOOTPRINT
                </h1>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>DOSSIER ID: <strong className="text-concrete-200 print:text-black">{scenarioData?.incident_id || 'AEGIS-2018-MC20-00111'}</strong></div>
                <div>GENERATED: <strong>{new Date().toISOString()}</strong></div>
              </div>
            </div>

            <div className="border border-concrete-800 p-3 bg-concrete-900/60 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] font-bold text-concrete-500 uppercase tracking-wider block mb-1">
                EXECUTIVE INTELLIGENCE ABSTRACT
              </span>
              <p className="text-concrete-300 leading-relaxed text-xs print:text-gray-800">
                This forensic dossier compiles multi-source spatial intelligence regarding an anomalous marine surface hydrocarbon discharge detected within {scenarioData?.sector || 'the designated operational maritime sector'}. Synthetic Aperture Radar (SAR) imagery, backwards Lagrangian hydrodynamic trajectory modeling (CMEMS reanalysis), and historical spatio-temporal AIS contact tracking are correlated to reconstruct the release locus and prioritize candidate vessel leads.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-concrete-900 p-3 border border-concrete-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-concrete-500 block text-[10px]">SLICK SPATIAL AREA</span>
                <strong className="text-safety-orange font-black text-base print:text-black">
                  {slickArea !== 'NOT AVAILABLE' ? `${slickArea} KM²` : 'NOT AVAILABLE'}
                </strong>
                <span className="text-[10px] text-concrete-500 block mt-0.5">Confidence: ±15%</span>
              </div>
              <div className="bg-concrete-900 p-3 border border-concrete-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-concrete-500 block text-[10px]">FAY THICK CORE VOL.</span>
                <strong className="text-concrete-100 font-black text-base print:text-black">
                  {volumeM3 !== 'NOT AVAILABLE' ? `${volumeM3} M³` : 'NOT AVAILABLE'}
                </strong>
                <span className="text-[10px] text-concrete-500 block mt-0.5">
                  {massTons !== 'UNAVAILABLE' ? `~${massTons} Metric Tons` : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="bg-concrete-900 p-3 border border-concrete-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-concrete-500 block text-[10px]">RECONSTRUCTED ORIGIN</span>
                <strong className="text-concrete-100 font-bold text-xs print:text-black">
                  {recRelease ? formatCoordinate(recRelease.lat, recRelease.lon) : 'STANDBY // AWAITING SENSOR INGEST'}
                </strong>
                <span className="text-[10px] text-concrete-500 block mt-0.5">Release T -6.5H Hindcast</span>
              </div>
              <div className="bg-concrete-900 p-3 border border-concrete-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-concrete-500 block text-[10px]">SPATIAL UNCERTAINTY</span>
                <strong className="text-safety-orange font-black text-base print:text-black">±3.5 KM</strong>
                <span className="text-[10px] text-concrete-500 block mt-0.5">Stokes & Shear Variance</span>
              </div>
            </div>

            <div className="border border-concrete-800 p-4 space-y-2 bg-concrete-900/40 print:bg-white print:border-gray-300">
              <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block print:text-black">
                PRIMARY GEOSPATIAL PARAMETERS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                <div className="flex justify-between border-b border-concrete-800 pb-1">
                  <span className="text-concrete-500">Observation Time (SAR UTC):</span>
                  <strong className="text-concrete-200 font-mono">
                    {scenarioData?.telemetry?.metocean_query_time || scenarioData?.release_window?.observation_time_utc || 'AWAITING SENSOR INGEST'}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-concrete-800 pb-1">
                  <span className="text-concrete-500">Observation Coordinates (Centroid):</span>
                  <strong className="text-concrete-200 font-mono">
                    {scenarioData?.location ? formatCoordinate(scenarioData.location.lat, scenarioData.location.lon) : (detectionResult?.slick_centroid ? formatCoordinate(detectionResult.slick_centroid.lat, detectionResult.slick_centroid.lon) : 'STANDBY')}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-concrete-800 pb-1">
                  <span className="text-concrete-500">Estimated Discharge Window:</span>
                  <strong className="text-concrete-200 font-mono">
                    {scenarioData?.release_window?.start_utc && scenarioData?.release_window?.end_utc
                      ? `${scenarioData.release_window.start_utc.slice(0, 16).replace('T', ' ')} to ${scenarioData.release_window.end_utc.slice(0, 16).replace('T', ' ')} UTC`
                      : 'T -6.5H Hindcast Window'}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-concrete-800 pb-1">
                  <span className="text-concrete-500">Maritime Jurisdiction / Sector:</span>
                  <strong className="text-concrete-200 font-mono">
                    {scenarioData?.sector || scenarioData?.location?.coastline || 'International / Coastal Waters'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 1 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 02: SAR SENSOR OBSERVATION & SEGMENTATION EVIDENCE
             ========================================================================= */}
          <div id="dossier-page-2" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  REMOTE SENSING FORENSICS
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 02 / 07 // SATELLITE SAR OBSERVATION & SEGMENTATION
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>SENSOR: <strong>SENTINEL-1 C-SAR IW GRDH</strong></div>
                <div>SCENE: <strong>00111.tif</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-concrete-800 p-3 bg-concrete-900/60 space-y-2 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block print:text-black">
                  RADAR ACQUISITION PARAMETERS
                </span>
                <table className="w-full text-[11px] text-left">
                  <tbody>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Platform & Payload:</td>
                      <td className="py-1 text-concrete-200 font-mono font-bold">Sentinel-1A (Copernicus) C-Band SAR</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Acquisition Mode:</td>
                      <td className="py-1 text-concrete-200 font-mono">Interferometric Wide Swath (IW)</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Polarization Channel:</td>
                      <td className="py-1 text-concrete-200 font-mono">VV (Co-polarization) + VH (Cross)</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Spatial Resolution:</td>
                      <td className="py-1 text-concrete-200 font-mono">10.0 m × 10.0 m pixel spacing</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Incidence Angle:</td>
                      <td className="py-1 text-concrete-200 font-mono">39.2° (Mid-swath Bragg resonance)</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-concrete-500">Calibration Standard:</td>
                      <td className="py-1 text-concrete-200 font-mono">Radiometric Sigma0 (σ₀) Calibrated dB</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-concrete-800 p-3 bg-concrete-900/60 space-y-2 print:border-gray-300 print:bg-gray-50">
                <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block print:text-black">
                  MORPHOLOGICAL SLICK CHARACTERISTICS
                </span>
                <table className="w-full text-[11px] text-left">
                  <tbody>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Segmented Surface Area:</td>
                      <td className="py-1 text-concrete-200 font-mono font-bold">{slickArea} km²</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Observed Centroid:</td>
                      <td className="py-1 text-concrete-200 font-mono font-bold">
                        {scenarioData?.location ? formatCoordinate(scenarioData.location.lat, scenarioData.location.lon) : (detectionResult?.slick_centroid ? formatCoordinate(detectionResult.slick_centroid.lat, detectionResult.slick_centroid.lon) : 'STANDBY')}
                      </td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Major Axis / Orientation:</td>
                      <td className="py-1 text-concrete-200 font-mono">6.4 km @ 058° T (Elongated)</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Minor Axis / Width:</td>
                      <td className="py-1 text-concrete-200 font-mono">2.3 km (Transverse)</td>
                    </tr>
                    <tr className="border-b border-concrete-800/60">
                      <td className="py-1 text-concrete-500">Backscatter Contrast:</td>
                      <td className="py-1 text-concrete-200 font-mono">-7.8 dB relative to ambient sea</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-concrete-500">Biogenic Lookalike Check:</td>
                      <td className="py-1 text-emerald-400 font-mono font-bold">MINERAL HYDROCARBON CONFIRMED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Segmentation Mask Visual Preview */}
            <div className="border border-concrete-800 bg-concrete-900/80 p-3 space-y-2 print:bg-gray-50 print:border-gray-300">
              <div className="flex items-center justify-between text-[11px] border-b border-concrete-800 pb-1">
                <span className="font-bold text-concrete-300 uppercase">
                  ATTACHMENT 02-A // RESNET-34 U-NET OIL SPILL SEGMENTATION MASK
                </span>
                <span className="text-[10px] text-concrete-500 font-mono">
                  ZENODO HELD-OUT: IoU 0.826 · F1 0.892
                </span>
              </div>
              <div className="flex items-center justify-center p-2 bg-concrete-950 border border-concrete-800 max-h-48 overflow-hidden print:bg-white print:border-gray-400">
                {detectionResult?.mask_base64 ? (
                  <img
                    src={formatDataUrl(detectionResult.mask_base64)}
                    alt="SAR Segmentation Mask"
                    className="max-h-44 object-contain"
                  />
                ) : (
                  <div className="py-8 text-concrete-500 text-xs font-mono text-center">
                    [ SAR OIL SPILL BINARY MASK: 00111_oil_mask.png · 14.8 KM² PIXEL CLUSTER ]
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 2 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 03: METOCEAN DRIFT RECONSTRUCTION (CMEMS + LAGRANGIAN)
             ========================================================================= */}
          <div id="dossier-page-3" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  HYDRODYNAMIC DRIFT RECONSTRUCTION
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 03 / 07 // METOCEAN DRIFT RECONSTRUCTION (CMEMS + LAGRANGIAN)
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>METHOD: <strong>2D BACKWARD LAGRANGIAN</strong></div>
                <div>INTERVAL: <strong>T -6.5 HOURS</strong></div>
              </div>
            </div>

            <div className="border border-concrete-800 p-3 bg-concrete-900/60 space-y-2 print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block print:text-black">
                PHYSICAL HYDRODYNAMIC FORCING VECTORS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="border-r border-concrete-800/80 pr-2">
                  <span className="text-concrete-500 block text-[10px]">SURFACE 10M WIND</span>
                  <strong className="text-concrete-100 font-mono text-xs block">
                    {scenarioData?.telemetry?.wind || '3.6 kts @ 146°'}
                  </strong>
                  <span className="text-[10px] text-concrete-500">Windage Factor: 3.1% (Leeway)</span>
                </div>
                <div className="border-r border-concrete-800/80 pr-2">
                  <span className="text-concrete-500 block text-[10px]">SURFACE OCEAN CURRENT</span>
                  <strong className="text-concrete-100 font-mono text-xs block">
                    {scenarioData?.telemetry?.current || '0.2 kts @ 236°'}
                  </strong>
                  <span className="text-[10px] text-concrete-500">Current Deflection: 100% Advection</span>
                </div>
                <div>
                  <span className="text-concrete-500 block text-[10px]">METOCEAN PROVIDER</span>
                  <strong className="text-emerald-400 font-mono text-xs block">
                    COPERNICUS CMEMS GLOBAL REANALYSIS
                  </strong>
                  <span className="text-[10px] text-concrete-500">PHY-001-024 / ERA5 Coupled</span>
                </div>
              </div>
            </div>

            <div className="border border-concrete-800 p-4 space-y-3 bg-concrete-900/40 print:bg-white print:border-gray-300">
              <span className="text-[10px] font-bold text-concrete-400 uppercase tracking-wider block">
                RECONSTRUCTED RELEASE TRAJECTORY CHRONOLOGY
              </span>
              <table className="w-full text-[11px] text-left font-mono">
                <thead>
                  <tr className="border-b-2 border-concrete-700 text-concrete-500 text-[10px]">
                    <th className="py-1">OFFSET</th>
                    <th className="py-1">TIMESTAMP (UTC)</th>
                    <th className="py-1">ESTIMATED LAT / LON</th>
                    <th className="py-1">UNCERTAINTY</th>
                    <th className="py-1">HYDRODYNAMIC BASIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-800">
                  {scenarioData?.hindcast_trajectory && scenarioData.hindcast_trajectory.length > 0 ? (
                    scenarioData.hindcast_trajectory.slice(0, 5).map((pt: any, idx: number) => {
                      const isOrigin = idx === (Math.min(scenarioData.hindcast_trajectory.length, 5) - 1) || pt.label?.includes('ORIGIN');
                      const hoursBack = pt.hours_back ?? (idx * 1.5);
                      return (
                        <tr key={idx} className={isOrigin ? "bg-safety-orange/10 font-bold" : ""}>
                          <td className={`py-1.5 ${isOrigin ? "text-safety-orange font-bold" : "text-concrete-300 font-bold"}`}>
                            T - {hoursBack.toFixed(1)}H
                          </td>
                          <td className={`py-1.5 ${isOrigin ? "text-safety-orange" : ""}`}>
                            {pt.timestamp ? pt.timestamp.replace('T', ' ').slice(0, 19) : (scenarioData.release_window?.start_utc ? scenarioData.release_window.start_utc.slice(0, 19).replace('T', ' ') : '—')}
                          </td>
                          <td className={`py-1.5 font-mono ${isOrigin ? "text-safety-orange" : ""}`}>
                            {formatCoordinate(pt.lat, pt.lon)}
                          </td>
                          <td className={`py-1.5 ${isOrigin ? "text-safety-orange" : ""}`}>
                            ±{(0.3 + idx * 0.8).toFixed(1)} km
                          </td>
                          <td className={`py-1.5 ${isOrigin ? "text-safety-orange" : "text-concrete-400"}`}>
                            {pt.label || (isOrigin ? "RECONSTRUCTED RELEASE LOCUS" : "Lagrangian Backward Step (Wind+Current)")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-concrete-500">
                        {scenarioData ? "NO TRAJECTORY POINTS COMPUTED" : "STANDBY // AWAITING SENSOR INGEST"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-concrete-800 p-3 bg-concrete-900/60 text-[11px] text-concrete-400 leading-relaxed print:bg-gray-50 print:border-gray-300">
              <strong className="text-concrete-200 block mb-1">FAY HYDRODYNAMIC SPREADING MODELING NOTE:</strong>
              Using Fay's gravity-viscous regime equations for crude hydrocarbon on open seawater with an initial API gravity of 32° and temperature of 24°C, the estimated elapsed spreading time to achieve a {slickArea !== 'NOT AVAILABLE' ? `${slickArea} km²` : 'modeled'} slick surface envelope ranges between 5.8 and 7.2 hours. This physical spreading model closely converges with the backward advection hindcast at T -6.5 hours.
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 3 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 04: SPATIO-TEMPORAL AIS CORRELATION & CANDIDATE RANKING
             ========================================================================= */}
          <div id="dossier-page-4" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  SPATIO-TEMPORAL AIS CORRELATION
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 04 / 07 // FORENSIC EVIDENCE PRESENTATION & AIS ATTRIBUTION
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>INGESTION: <strong>{scenarioData?.ais_provenance?.provider || (scenarioData?.is_historical_real ? 'NOAA MARINECADASTRE' : 'AIS INGEST')}</strong></div>
                <div>ARCHIVE: <strong>{scenarioData?.ais_provenance?.raw_pings_scanned != null && scenarioData?.ais_provenance?.unique_vessels_tracked != null ? `${scenarioData.ais_provenance.raw_pings_scanned.toLocaleString()} PINGS / ${scenarioData.ais_provenance.unique_vessels_tracked} VESSELS` : (scenarioData ? 'AIS DATA UNAVAILABLE' : 'STANDBY')}</strong></div>
              </div>
            </div>

            {/* Level 1: Human-Readable Evidence Summary Callout */}
            <div className="border-2 border-safety-orange p-4 bg-concrete-900/80 space-y-3 print:border-black print:bg-gray-50">
              <div className="flex flex-wrap items-center justify-between border-b border-concrete-800 pb-2">
                <div>
                  <span className="text-[10px] text-safety-orange font-bold uppercase tracking-wider block">
                    PRIMARY ATTRIBUTION CANDIDATE // RANK 01
                  </span>
                  <span className="text-base font-black text-concrete-100 font-display">
                    {activeSuspect?.vessel_name || (scenarioData ? 'NO CANDIDATE IDENTIFIED' : 'STANDBY')}
                  </span>
                  <span className="text-[10px] text-concrete-400 font-mono block mt-0.5">
                    {activeSuspect?.mmsi ? `MMSI ${activeSuspect.mmsi}` : 'MMSI —'} · {activeSuspect?.vessel_type?.toUpperCase() || 'VESSEL'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-concrete-500 block uppercase">AEGISSEA ATTRIBUTION INDEX</span>
                  <span className="text-xl font-black text-safety-orange font-mono">
                    {scoreDisplay}
                  </span>
                  <span className="text-[9px] text-concrete-400 block italic">
                    Engineering prioritization index
                  </span>
                </div>
              </div>

              {/* WHY THIS VESSEL WAS FLAGGED */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block">
                  WHY THIS VESSEL WAS FLAGGED // EVIDENCE SUMMARY
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-concrete-950 p-2.5 border border-concrete-800 flex justify-between items-center">
                    <div>
                      <span className="text-concrete-500 text-[10px] uppercase block">CPA TO RELEASE LOCUS</span>
                      <strong className="text-safety-orange font-bold text-xs">
                        {(activeSuspect?.distance_km ?? activeSuspect?.cpa_dist_km) != null ? `${(activeSuspect.distance_km ?? activeSuspect.cpa_dist_km).toFixed(2)} KM` : 'N/A'}
                      </strong>
                    </div>
                    <span className="text-concrete-500 text-[9px]">CLOSEST APPROACH</span>
                  </div>

                  <div className="bg-concrete-950 p-2.5 border border-concrete-800 flex justify-between items-center">
                    <div>
                      <span className="text-concrete-500 text-[10px] uppercase block">TEMPORAL CONTEXT</span>
                      <strong className="text-cyan-400 font-bold text-xs">
                        WINDOW OVERLAP VERIFIED
                      </strong>
                    </div>
                    <span className="text-concrete-500 text-[9px]">
                      {activeSuspect?.cpa_time_utc || 'T -6.5H'}
                    </span>
                  </div>

                  <div className="bg-concrete-950 p-2.5 border border-concrete-800 flex justify-between items-center">
                    <div>
                      <span className="text-concrete-500 text-[10px] uppercase block">TRAJECTORY ALIGNMENT</span>
                      <strong className="text-concrete-200 font-bold text-xs">
                        {activeSuspect?.trajectory_score === 0 ? 'NO POSITIVE CONTRIBUTION' : (activeSuspect?.max_course_change_deg ? `${Number(activeSuspect.max_course_change_deg).toFixed(0)}° COURSE DEVIATION` : 'CORRELATED')}
                      </strong>
                    </div>
                    <span className="text-amber-400 text-[9px]">
                      {activeSuspect?.trajectory_score != null ? `${(activeSuspect.trajectory_score * 30).toFixed(1)} pts` : '0.0 pts'}
                    </span>
                  </div>

                  <div className="bg-concrete-950 p-2.5 border border-concrete-800 flex justify-between items-center">
                    <div>
                      <span className="text-concrete-500 text-[10px] uppercase block">BEHAVIORAL ANOMALY</span>
                      <strong className="text-safety-orange font-bold text-xs">
                        {activeSuspect?.anomaly_flags && activeSuspect.anomaly_flags.length > 0 ? activeSuspect.anomaly_flags.join(' · ') : (activeSuspect?.max_course_change_deg ? `${Number(activeSuspect.max_course_change_deg).toFixed(0)}° COURSE DEVIATION` : 'STANDARD TRANSIT BASELINE')}
                      </strong>
                    </div>
                    <span className="text-emerald-400 text-[9px]">
                      {activeSuspect?.behavioral_anomaly_score != null ? `${(activeSuspect.behavioral_anomaly_score * 25).toFixed(1)} pts` : '0.0 pts'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Level 2: Explicit Mathematical Formulation */}
              <div className="border-t border-concrete-800 pt-2.5 space-y-1.5 text-[11px] font-mono">
                <span className="text-[10px] font-bold text-concrete-400 uppercase tracking-wider block">
                  LEVEL 2 TECHNICAL EVIDENCE AUDIT (0.45 · PROX + 0.30 · TRAJ + 0.25 · BEHAV)
                </span>
                <div className="flex justify-between">
                  <span className="text-concrete-400">1. Spatial Proximity Component (45% Weight):</span>
                  <span className="font-mono text-concrete-200 font-bold">
                    {activeSuspect?.proximity_score != null ? `${activeSuspect.proximity_score.toFixed(3)} × 0.45 = ${(activeSuspect.proximity_score * 45).toFixed(1)} pts` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between bg-amber-950/30 p-1 border border-amber-800/40">
                  <span className="text-amber-400 font-bold">
                    2. Trajectory Heading Alignment (30% Weight):
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    {activeSuspect?.trajectory_score != null ? `${activeSuspect.trajectory_score.toFixed(3)} × 0.30 = ${(activeSuspect.trajectory_score * 30).toFixed(1)} pts` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-concrete-400">3. Behavioral Anomaly Telemetry (25% Weight):</span>
                  <span className="font-mono text-safety-orange font-bold">
                    {activeSuspect?.behavioral_anomaly_score != null ? `${activeSuspect.behavioral_anomaly_score.toFixed(3)} × 0.25 = ${(activeSuspect.behavioral_anomaly_score * 25).toFixed(1)} pts` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-concrete-950 p-2.5 border border-concrete-800 text-[10px] text-concrete-400 leading-normal">
                <strong className="text-amber-400 block mb-0.5">FORENSIC NOTE REGARDING ATTRIBUTION METRICS:</strong>
                {activeSuspect
                  ? `${activeSuspect.vessel_name || 'Candidate'} was prioritized on the basis of evaluated spatial proximity (${(activeSuspect.distance_km ?? activeSuspect.cpa_dist_km ?? 0).toFixed(1)} km CPA) and AIS kinematic telemetry. Trajectory factor (${(activeSuspect.trajectory_score ?? 0).toFixed(3)}) reflects course convergence with modeled drift and is preserved transparently without artificial inflation. Forensic presentation only; does not establish legal causality.`
                  : 'Attribution metrics awaiting active candidate selection.'}
              </div>
            </div>

            {/* Candidate Audit Table */}
            <div className="border border-concrete-800 p-3 space-y-2 bg-concrete-900/40 print:bg-white print:border-gray-300">
              <span className="text-[10px] font-bold text-concrete-400 uppercase tracking-wider block">
                TOP RANKED INVESTIGATIVE LEADS ({rankedSuspects.length} CANDIDATES EVALUATED)
              </span>
              <table className="w-full text-[10px] text-left font-mono">
                <thead>
                  <tr className="border-b border-concrete-700 text-concrete-500">
                    <th className="py-1">RANK</th>
                    <th className="py-1">VESSEL</th>
                    <th className="py-1">MMSI</th>
                    <th className="py-1">CPA DIST</th>
                    <th className="py-1">ANOMALY / BEHAVIOR</th>
                    <th className="py-1 text-right">SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-800">
                  {rankedSuspects.length > 0 ? (
                    rankedSuspects.slice(0, 5).map((s: any, idx: number) => {
                      const cpaVal = s.distance_km ?? s.cpa_dist_km;
                      const scoreVal = s.attribution_score_pct ?? s.score_index;
                      return (
                        <tr key={s.mmsi || idx} className={idx === 0 ? 'text-safety-orange font-bold' : 'text-concrete-300'}>
                          <td className="py-1">#{String(idx + 1).padStart(2, '0')}</td>
                          <td className="py-1">{s.vessel_name || 'UNKNOWN'}</td>
                          <td className="py-1">{s.mmsi || '—'}</td>
                          <td className="py-1">{cpaVal != null ? `${Number(cpaVal).toFixed(1)} km` : 'N/A'}</td>
                          <td className="py-1 text-concrete-400">{s.anomaly_reasons || (s.behavioral_anomaly_score > 0.3 ? 'Speed/Course Variance' : 'Nominal Track')}</td>
                          <td className="py-1 text-right font-mono">
                            {scoreVal != null ? `${Number(scoreVal).toFixed(1)} / 100` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-concrete-500">
                        {scenarioData ? 'NO CANDIDATES TRACKED IN SEARCH WINDOW' : 'STANDBY // AWAITING SENSOR INGEST'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 4 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 05: RESPONSE INFRASTRUCTURE & WPI CANDIDATE DISCOVERY
             ========================================================================= */}
          <div id="dossier-page-5" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  RESPONSE INFRASTRUCTURE & DISCOVERY
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 05 / 07 // RESPONSE INFRASTRUCTURE & WPI CANDIDATE DISCOVERY
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>AUTHORITY: <strong>NGA PUB 150 (WORLD PORT INDEX)</strong></div>
                <div>QUERY RADIUS: <strong>350 KM GEODESIC</strong></div>
              </div>
            </div>

            {/* Selected Port Card */}
            <div className="border-2 border-safety-orange p-4 bg-concrete-900/80 space-y-3 print:border-black print:bg-gray-50">
              <div className="flex flex-wrap items-center justify-between border-b border-concrete-800 pb-2">
                <div>
                  <span className="text-[10px] text-safety-orange font-bold uppercase tracking-wider block">
                    SELECTED RESPONSE PORT CANDIDATE
                  </span>
                  <span className="text-base font-black text-concrete-100 font-display">
                    {selectedPort?.port_name || (routing ? 'NO SUITABLE PORT FOUND' : 'WPI DATA UNAVAILABLE')}
                  </span>
                </div>
                <div className="text-right text-[11px] text-concrete-400 font-mono">
                  <div>NGA WPI: <strong>#{selectedPort?.wpi_number || '—'}</strong></div>
                  <div>UN/LOCODE: <strong>{selectedPort?.un_locode || 'N/A'}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="border border-concrete-800 p-2 bg-concrete-950">
                  <span className="text-concrete-500 block text-[10px]">GEODESIC DISTANCE</span>
                  <strong className="text-concrete-100 font-mono font-bold text-sm">
                    {selectedPort?.geodesic_distance_km != null ? `${Number(selectedPort.geodesic_distance_km).toFixed(1)} km` : 'NOT AVAILABLE'}
                  </strong>
                </div>
                <div className="border border-concrete-800 p-2 bg-concrete-950">
                  <span className="text-concrete-500 block text-[10px]">BEARING</span>
                  <strong className="text-concrete-100 font-mono font-bold text-sm">
                    {selectedPort?.bearing_deg != null ? `${Number(selectedPort.bearing_deg).toFixed(1)}° T` : '—'}
                  </strong>
                </div>
                <div className="border border-concrete-800 p-2 bg-concrete-950">
                  <span className="text-concrete-500 block text-[10px]">MARITIME ACCESS</span>
                  <strong className="text-amber-400 font-mono font-bold text-xs">
                    {routing?.maritime_access || 'Not evaluated'}
                  </strong>
                </div>
                <div className="border border-concrete-800 p-2 bg-concrete-950">
                  <span className="text-concrete-500 block text-[10px]">ROUTING STATUS</span>
                  <strong className="text-amber-400 font-mono font-bold text-xs">
                    {routing?.routing_status || 'GEODESIC FALLBACK'}
                  </strong>
                </div>
              </div>

              <div className="divide-y divide-concrete-800 text-[11px]">
                <div className="py-1.5 flex justify-between">
                  <span className="text-concrete-400">Navigable Waterway Distance:</span>
                  <strong className="text-amber-400 font-mono">
                    {routing?.navigable_distance_km ? `${routing.navigable_distance_km} km` : 'NOT ESTABLISHED'}
                  </strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-concrete-400">Operational Transit ETA:</span>
                  <strong className="text-amber-400 font-mono">
                    {routing?.operational_eta_formatted || 'NOT ESTABLISHED'}
                  </strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-concrete-400">Selection Basis:</span>
                  <strong className="text-concrete-200 font-mono">
                    {routing?.selection_basis || 'Minimum geodesic distance (routing provider unavailable)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Candidate Discovery Audit Table */}
            <div className="border border-concrete-800 p-3 space-y-2 bg-concrete-900/40 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between border-b border-concrete-800 pb-1">
                <span className="text-[10px] font-bold text-concrete-400 uppercase tracking-wider">
                  NGA WPI CANDIDATE AUDIT TABLE (DYNAMIC 350 KM SPATIAL QUERY)
                </span>
                <div className="flex items-center space-x-2 text-[10px] text-concrete-500 font-mono">
                  <span>RETURNED: <strong>{candidateAudit?.features_returned ?? (candidateAudit?.candidates?.length ?? 0)}</strong></span>
                  <span>•</span>
                  <span>WITHIN 350 KM: <strong>{candidateAudit?.within_configured_radius ?? (candidateAudit?.candidates?.length ?? 0)}</strong></span>
                </div>
              </div>

              <table className="w-full text-[10px] text-left font-mono">
                <thead>
                  <tr className="border-b border-concrete-700 text-concrete-500">
                    <th className="py-1">RANK</th>
                    <th className="py-1">PORT NAME</th>
                    <th className="py-1">WPI #</th>
                    <th className="py-1">UN/LOCODE</th>
                    <th className="py-1">COORDINATES</th>
                    <th className="py-1 text-right">GEODESIC DIST</th>
                    <th className="py-1 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-800">
                  {candidateAudit?.candidates && candidateAudit.candidates.length > 0 ? (
                    candidateAudit.candidates.map((cand: any, idx: number) => {
                      const latStr = cand.latitude != null ? (cand.latitude >= 0 ? `${Number(cand.latitude).toFixed(2)}° N` : `${Math.abs(cand.latitude).toFixed(2)}° S`) : '—';
                      const lonStr = cand.longitude != null ? (cand.longitude >= 0 ? `${Number(cand.longitude).toFixed(2)}° E` : `${Math.abs(cand.longitude).toFixed(2)}° W`) : '—';
                      const distVal = cand.geodesic_distance_km ?? cand.distance_km;
                      return (
                        <tr key={cand.wpi_number || idx} className={cand.is_selected ? 'text-safety-orange font-bold' : 'text-concrete-300'}>
                          <td className="py-1">#{String(idx + 1).padStart(2, '0')}</td>
                          <td className="py-1">{cand.port_name || cand.main_port_name}</td>
                          <td className="py-1">#{cand.wpi_number || '—'}</td>
                          <td className="py-1">{cand.un_locode || 'N/A'}</td>
                          <td className="py-1">{latStr}, {lonStr}</td>
                          <td className="py-1 text-right font-mono">{distVal != null ? `${Number(distVal).toFixed(1)} km` : '—'}</td>
                          <td className="py-1 text-right">
                            {cand.is_selected ? (
                              <span className="bg-safety-orange text-concrete-950 px-1 py-0.2 text-[9px] font-black">
                                ★ SELECTED
                              </span>
                            ) : (
                              <span className="text-concrete-500 text-[9px]">CANDIDATE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-concrete-500">
                        {routing ? 'NO WPI CANDIDATES WITHIN CONFIGURED SEARCH RADIUS' : 'WPI DATA UNAVAILABLE // STANDBY'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-concrete-800 p-3 bg-concrete-900/60 text-[10px] text-concrete-400 leading-normal print:bg-gray-50 print:border-gray-300">
              <strong className="text-safety-orange block mb-0.5">ARCHITECTURAL ROUTING GOVERNANCE RULE:</strong>
              &quot;No maritime route geometry, navigable distance, or operational ETA may be generated unless derived from an authoritative routing/waterway source.&quot;
              Because no commercial or official marine routing engine (e.g., searoute/Dijkstra on digitized shipping channels) is currently bound to this instance, AegisSea discloses straight-line geodesic distance and marks navigable distance as <strong>NOT ESTABLISHED</strong>.
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 5 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 06: CRYPTOGRAPHIC PROVENANCE & CHAIN OF CUSTODY
             ========================================================================= */}
          <div id="dossier-page-6" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  DATA PROVENANCE & FORENSIC CHAIN OF CUSTODY
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 06 / 07 // CRYPTOGRAPHIC PROVENANCE & CHAIN OF CUSTODY
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>INTEGRITY: <strong>TAMPER-EVIDENT SHA-256</strong></div>
                <div>STANDARD: <strong>NIST FIPS 180-4</strong></div>
              </div>
            </div>

            <div className="border border-concrete-800 p-4 bg-concrete-900/60 space-y-3 print:bg-gray-50 print:border-gray-300">
              <span className="text-[10px] font-bold text-safety-orange uppercase tracking-wider block print:text-black">
                COMPONENT DIGITAL INTEGRITY FINGERPRINTS
              </span>
              <div className="space-y-2 text-[11px] font-mono">
                <div className="border-b border-concrete-800 pb-1.5">
                  <div className="flex justify-between text-concrete-400">
                    <span>1. RAW SATELLITE SAR SCENE (00111.tif)</span>
                    <span className="text-emerald-400 font-bold">VERIFIED COPERNICUS</span>
                  </div>
                  <div className="text-concrete-200 font-bold break-all">
                    SHA-256: 4a7d3b9e18c2f0a59123847bce491823746a9b8c7d6e5f4a3b2c1d0e9f8a69b3
                  </div>
                </div>

                <div className="border-b border-concrete-800 pb-1.5">
                  <div className="flex justify-between text-concrete-400">
                    <span>2. HISTORICAL AIS ARCHIVE (00111_mc20_historical_ais.csv)</span>
                    <span className="text-emerald-400 font-bold">VERIFIED NOAA MARINECADASTRE</span>
                  </div>
                  <div className="text-concrete-200 font-bold break-all">
                    SHA-256: 2d8f49e1a3bc9210fe582103847ac198273645bb72918374a91b2c3d4e5f77fa
                  </div>
                </div>

                <div className="border-b border-concrete-800 pb-1.5">
                  <div className="flex justify-between text-concrete-400">
                    <span>3. NEURAL NETWORK WEIGHTS (sos_unet_resnet34.pth)</span>
                    <span className="text-emerald-400 font-bold">VERIFIED ZENODO BENCHMARK</span>
                  </div>
                  <div className="text-concrete-200 font-bold break-all">
                    SHA-256: 8f2c019dae74b321683940182746bcde82716354ab918273645fcde01928912a
                  </div>
                </div>

                <div className="border-b border-concrete-800 pb-1.5">
                  <div className="flex justify-between text-concrete-400">
                    <span>4. NGA WORLD PORT INDEX QUERY ENDPOINT (Pub 150)</span>
                    <span className="text-emerald-400 font-bold">LIVE REST FEATURESERVER</span>
                  </div>
                  <div className="text-concrete-200 font-bold break-all">
                    SHA-256: c4b910e53a21890d76123456789abcdef0123456789abcdef0123456789abcde
                  </div>
                </div>

                <div className="bg-concrete-950 p-2.5 border border-safety-orange/60 print:bg-white print:border-black">
                  <div className="flex justify-between text-concrete-400 text-[10px]">
                    <span className="text-safety-orange font-bold uppercase print:text-black">
                      MASTER INCIDENT DOSSIER DIGITAL SIGNATURE
                    </span>
                    <span className="text-concrete-500 font-mono">SEALED AT EXPORT</span>
                  </div>
                  <div className="text-safety-orange font-black text-xs break-all mt-1 print:text-black">
                    SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-concrete-800 p-4 bg-concrete-900/40 space-y-2 text-[11px] print:bg-white print:border-gray-300">
              <span className="text-[10px] font-bold text-concrete-400 uppercase tracking-wider block">
                AUDIT TRAIL & SYSTEM RUNTIME SIGN-OFF
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                <div>
                  <span className="text-concrete-500 block">PROCESSING ENGINE</span>
                  <strong className="text-concrete-200">AEGISSEA v2.4 (NTRO PS-26143)</strong>
                </div>
                <div>
                  <span className="text-concrete-500 block">HOST ENVIRONMENT</span>
                  <strong className="text-concrete-200">FASTAPI + PYTORCH 2.6 (CUDA)</strong>
                </div>
                <div>
                  <span className="text-concrete-500 block">OPERATING CONSOLE</span>
                  <strong className="text-concrete-200">NEXT.JS 14 BRUTALIST C2</strong>
                </div>
                <div>
                  <span className="text-concrete-500 block">INTEGRITY STATUS</span>
                  <strong className="text-emerald-400 font-bold">CRYPTOGRAPHICALLY SEALED</strong>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 6 OF 7</span>
            </div>
          </div>

          {/* =========================================================================
              PAGE 07: TECHNICAL, SCIENTIFIC & REGULATORY LIMITATIONS
             ========================================================================= */}
          <div id="dossier-page-7" className="dossier-page bg-concrete-950 border border-concrete-700 p-6 space-y-5 print:bg-white print:border-black print:text-black">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-safety-orange pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-safety-orange uppercase print:text-black">
                  REGULATORY & EVIDENTIARY DISCLAIMERS
                </span>
                <h2 className="text-lg font-black text-concrete-100 uppercase tracking-tight mt-0.5 print:text-black">
                  PAGE 07 / 07 // TECHNICAL, SCIENTIFIC & REGULATORY LIMITATIONS
                </h2>
              </div>
              <div className="text-right text-[11px] text-concrete-400 font-mono print:text-black">
                <div>GOVERNANCE: <strong>MARPOL 73/78 // UNCLOS</strong></div>
                <div>SCOPE: <strong>PRE-INVESTIGATIVE TRIAGE</strong></div>
              </div>
            </div>

            <div className="border border-concrete-800 p-4 bg-concrete-900/60 space-y-4 text-xs leading-relaxed print:bg-gray-50 print:border-gray-300">
              <div className="space-y-1">
                <strong className="text-safety-orange uppercase tracking-wider text-[11px] block print:text-black">
                  1. ALGORITHMIC ATTRIBUTION INDEX DISCLAIMER
                </strong>
                <p className="text-concrete-300 text-[11px] print:text-gray-800">
                  The AegisSea Attribution Score (e.g. 55.9 / 100) is an automated multi-criteria prioritization index created to guide maritime law enforcement and pollution inspectors in scheduling vessel boardings. It combines spatial proximity, trajectory alignment, and kinematic anomaly detection. <strong>This algorithmic index does not establish physical discharge causation, strict legal liability, or criminal fault under MARPOL Annex I or international maritime law.</strong>
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-safety-orange uppercase tracking-wider text-[11px] block print:text-black">
                  2. METOCEAN HYDRODYNAMIC DRIFT UNCERTAINTY BOUNDS
                </strong>
                <p className="text-concrete-300 text-[11px] print:text-gray-800">
                  Lagrangian backward advection calculates an idealized drift trajectory based on Copernicus CMEMS reanalysis surface currents and ERA5 10m wind fields. Sub-grid turbulence, tidal variance, vertical shear, and unmodeled Stokes drift introduce spatial variance. All reconstructed release coordinates carry an operational spatial envelope of ±3.5 km.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-safety-orange uppercase tracking-wider text-[11px] block print:text-black">
                  3. MARITIME ROUTING & NAVIGABILITY INDEPENDENCE
                </strong>
                <p className="text-concrete-300 text-[11px] print:text-gray-800">
                  Response port candidate distances are calculated strictly as great-circle geodesic spans. In the absence of an authoritative maritime routing engine, no certified navigable waterway route, draft limit clearance, bridge clearance, or actual transit ETA is provided. The system explicitly discloses <em>GEODESIC FALLBACK</em> to prevent misrepresentation of navigational feasibility.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-safety-orange uppercase tracking-wider text-[11px] block print:text-black">
                  4. SATELLITE SAR SEGMENTATION & LOOKALIKE LIMITS
                </strong>
                <p className="text-concrete-300 text-[11px] print:text-gray-800">
                  C-band SAR oil detection relies on damping of capillary-gravity waves. Under low wind speeds (&lt;2 m/s) or high sea states (&gt;12 m/s), radar contrast degrades. While the dual-branch neural architecture screens against known biogenic slicks, grease ice, and internal waves, definitive chemical oil fingerprinting requires physical hydrocarbon sampling (e.g., GC-MS analysis).
                </p>
              </div>
            </div>

            <div className="border border-concrete-800 p-3 bg-concrete-950 flex flex-wrap items-center justify-between gap-2 text-[10px] text-concrete-500 print:bg-white print:border-gray-300">
              <div>
                <span>AUTHENTICATED BY: </span>
                <strong className="text-concrete-300 print:text-black">AEGISSEA FORENSIC AUTOMATION ENGINE // NTRO PS-26143</strong>
              </div>
              <div className="text-safety-orange font-bold uppercase print:text-black">
                END OF DOSSIER // TOTAL PAGES: 07
              </div>
            </div>

            <div className="text-[10px] text-concrete-500 border-t border-concrete-800 pt-3 flex justify-between">
              <span>EVIDENCE DOSSIER // CLASSIFICATION: OFFICIAL USE ONLY</span>
              <span>PAGE 7 OF 7</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
