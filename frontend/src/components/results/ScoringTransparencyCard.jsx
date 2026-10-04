import React from 'react';
import { Scale, Lock, Info } from 'lucide-react';

export const ScoringTransparencyCard = ({ transparency }) => {
  if (!transparency) return null;

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-white/15 text-neutral-200 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">How This Score Was Calculated</h2>
            <p className="text-xs text-neutral-400">Deterministic scoring policy & mathematical transparency</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400 self-start sm:self-center">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scoring Engine v{transparency.scoring_version}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-2">
          {(transparency.methodology || []).slice(0, 3).map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 text-xs text-neutral-300 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span className="font-sans leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {(transparency.methodology || []).slice(3).map((item, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-[#141414] border border-white/10 text-xs text-neutral-300 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span className="font-sans leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {transparency.applied_weights && Object.keys(transparency.applied_weights).length > 0 && (
        <div className="p-4 rounded-2xl bg-[#141414]/90 border border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <span className="text-neutral-400 uppercase text-[10px] tracking-wider">Exact Applied Weights:</span>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(transparency.applied_weights).map(([k, w]) => (
              <span key={k} className="px-2.5 py-1 rounded-xl bg-black border border-white/15 text-neutral-200">
                <span className="capitalize">{k.replace('_', ' ')}</span>: <strong className="text-emerald-400">{Math.round(w * 100)}%</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
