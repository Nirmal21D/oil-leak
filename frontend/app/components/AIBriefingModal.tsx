'use client';

import React, { useState, useEffect } from 'react';

interface AIBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData?: any;
  detectionResult?: any;
}

export default function AIBriefingModal({
  isOpen,
  onClose,
  scenarioData,
  detectionResult,
}: AIBriefingModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = scenarioData ? { ...scenarioData } : null;
      if (payload && detectionResult?.morphology) {
        payload.detected_slick = detectionResult.morphology;
      }

      const res = await fetch('http://127.0.0.1:8000/api/v1/briefing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      if (!res.ok) {
        throw new Error(`Briefing service responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      setBriefingData(data);
    } catch (err: any) {
      console.error('Failed to generate AI briefing:', err);
      setError(err?.message || 'Unable to contact briefing service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !briefingData) {
      fetchBriefing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (briefingData?.full_text) {
      navigator.clipboard.writeText(
        `${briefingData.headline}\n\n${briefingData.full_text}\n\n${briefingData.disclaimer}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const primaryCandidate = scenarioData?.ranked_suspects?.[0];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-tactical-base/90 backdrop-blur-md font-mono select-none">
      <div className="bg-tactical-panel border-2 border-tactical-border max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-[12px_12px_0px_#08090c] flex flex-col text-tactical-text">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-tactical-border bg-tactical-navy flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-tactical-amber text-tactical-base px-2 py-0.5 font-black text-xs uppercase tracking-wider">
                🤖 PRESENTATION LAYER
              </span>
              <span className="border border-tactical-border px-2 py-0.5 text-tactical-cyan text-[10px] uppercase font-bold">
                DOWNSTREAM GROUNDED BRIEFING
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-tactical-text uppercase font-display mt-0.5">
              FORENSIC INTELLIGENCE EXECUTIVE BRIEFING
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="brutalist-btn px-2.5 py-1 text-xs font-bold uppercase tracking-wider hover:text-tactical-cyan disabled:opacity-50 cursor-pointer"
              title="Regenerate Briefing"
            >
              [ 🔄 REGENERATE ]
            </button>
            <button
              onClick={onClose}
              className="brutalist-btn px-2.5 py-1 text-xs font-bold uppercase tracking-wider hover:text-red-400 cursor-pointer"
            >
              [ ✕ CLOSE ]
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-tactical-base border-b border-tactical-border px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-tactical-muted">
          <div className="flex items-center space-x-3">
            <span>SCENE: <strong className="text-tactical-text">{scenarioData?.scenario_id || 'ACTIVE SCENE'}</strong></span>
            <span>•</span>
            <span>LEAD CONTACT: <strong className="text-tactical-amber">{primaryCandidate?.vessel_name || 'PENDING EVALUATION'}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-tactical-dim">ENGINE:</span>
            <span className="stamp-tag border-tactical-cyan text-tactical-cyan text-[9px] px-1.5 py-0.2">
              {briefingData?.source === 'gemini-1.5-flash' ? '● GEMINI 1.5 FLASH' : '⚙️ DETERMINISTIC FORENSIC ENGINE'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs leading-relaxed">
          
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-tactical-muted">
              <div className="w-8 h-8 border-2 border-tactical-amber border-t-transparent animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest text-tactical-amber animate-pulse">
                Synthesizing Multi-Source Forensic Telemetry...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 border border-red-500/50 bg-red-950/20 text-red-300 space-y-2">
              <strong className="block uppercase text-xs font-bold text-red-400">Briefing Generation Notice</strong>
              <p>{error}</p>
              <button
                onClick={fetchBriefing}
                className="brutalist-btn-orange px-3 py-1 text-xs font-bold uppercase mt-2 cursor-pointer"
              >
                Retry Generation
              </button>
            </div>
          ) : briefingData ? (
            <>
              {/* Headline */}
              <div className="border border-tactical-border bg-tactical-navy p-3 space-y-1">
                <span className="text-[10px] text-tactical-dim font-bold uppercase tracking-wider block">
                  ACTIONABLE INTELLIGENCE HEADLINE
                </span>
                <h3 className="text-sm font-black text-tactical-amber uppercase font-display">
                  {briefingData.headline}
                </h3>
              </div>

              {/* Formatted 3-Paragraph Narrative */}
              <div className="space-y-3 font-mono text-tactical-text bg-tactical-base/60 p-4 border border-tactical-border">
                {briefingData.full_text.split('\n\n').map((paragraph: string, idx: number) => {
                  const [title, ...rest] = paragraph.split(': ');
                  const bodyText = rest.join(': ');

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="text-[11px] font-bold text-tactical-cyan uppercase tracking-wider">
                        {title}
                      </div>
                      <p className="text-tactical-muted text-xs leading-relaxed text-justify">
                        {bodyText || title}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Evidentiary Boundary Disclaimer */}
              <div className="p-3 border border-tactical-border bg-tactical-navy text-[11px] space-y-1 text-tactical-dim">
                <span className="text-tactical-amber font-bold uppercase block text-[10px]">
                  ⚠️ FORENSIC & JURISDICTIONAL EVIDENCE BOUNDARIES
                </span>
                <p>
                  {briefingData.disclaimer ||
                    'Engineering prioritization index only. This briefing does not constitute an accusation, judicial verdict, or legal proof of liability under MARPOL Annex I / UNCLOS.'}
                </p>
              </div>
            </>
          ) : null}

        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-tactical-border bg-tactical-navy flex items-center justify-between">
          <span className="text-[10px] text-tactical-dim">
            CONFIDENTIAL // LAW ENFORCEMENT & MARITIME RESPONSE TRIAGE
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              disabled={!briefingData}
              className="brutalist-btn-orange px-3 py-1 text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY BRIEFING TEXT'}
            </button>
            <button
              onClick={onClose}
              className="brutalist-btn px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
