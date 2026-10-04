import React from 'react';
import { CheckCircle2, TrendingUp, Sparkles, Target } from 'lucide-react';

export const StrengthsAndImprovements = ({ strengths, improvements }) => {
  const safeStrengths = strengths && strengths.length > 0 ? strengths : [];
  const safeImprovements = improvements && improvements.length > 0 ? improvements : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Key Strengths */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Demonstrated Strengths</h2>
            <p className="text-xs text-neutral-400">Validated competencies from your evaluation</p>
          </div>
        </div>

        {safeStrengths.length > 0 ? (
          <ul className="space-y-3 pt-2">
            {safeStrengths.map((str, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-start gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="text-xs text-neutral-200 leading-relaxed font-sans">{str}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 rounded-2xl bg-[#141414] border border-white/10 text-center text-neutral-400 text-xs font-mono">
            No specific strengths flagged for this session attempt.
          </div>
        )}
      </div>

      {/* Areas for Growth & Improvement */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Recommended Growth Areas</h2>
            <p className="text-xs text-neutral-400">Targeted actions to elevate your score</p>
          </div>
        </div>

        {safeImprovements.length > 0 ? (
          <ul className="space-y-3 pt-2">
            {safeImprovements.map((imp, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-start gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="text-xs text-neutral-200 leading-relaxed font-sans">{imp}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 rounded-2xl bg-[#141414] border border-white/10 text-center text-neutral-400 text-xs font-mono">
            No critical improvement areas flagged for this session.
          </div>
        )}
      </div>
    </div>
  );
};
