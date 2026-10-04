import React from 'react';
import { HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ScoreExplanationCard = ({ scoreExplanations }) => {
  if (!scoreExplanations || scoreExplanations.length === 0) return null;

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Why Did I Receive This Score?</h2>
          <p className="text-xs text-neutral-400">Deterministic explanation of your overall performance breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {scoreExplanations.map((explanation, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#141414]/90 border border-white/10 space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
