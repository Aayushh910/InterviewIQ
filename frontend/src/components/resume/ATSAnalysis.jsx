import React from 'react';
import { Award, CheckCircle2, AlertTriangle, Sparkles, FileCheck, ArrowUpRight } from 'lucide-react';

export const ATSAnalysis = ({ resume }) => {
  if (!resume) return null;

  const metrics = [
    { label: "Overall ATS Rating", score: `${resume.matchScore}%`, status: "High Optimization" },
    { label: "Grammar & Structure", score: "96%", status: "Error Free" },
    { label: "Keyword Match Ratio", score: "91%", status: "Strong Alignment" },
    { label: "Action Verbs Metric", score: "88%", status: "Quantified Impact" },
  ];

  const missingSkills = ['Kubernetes', 'GraphQL Federation', 'Jest/RTL Testing', 'Kafka Event Streaming'];

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/15 flex items-center justify-center text-cyan-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              ATS Deep Analysis: {resume.fileName}
            </h2>
            <p className="text-xs text-neutral-400">Evaluated against {resume.targetRole} benchmark</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-bold font-mono shadow-sm">
          ATS Score: {resume.matchScore}%
        </span>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-[#141414]/80 border border-white/10">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">{m.label}</span>
            <div className="text-xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 mt-1">
              {m.score}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">{m.status}</span>
          </div>
        ))}
      </div>

      {/* Missing Skills & Actionable AI Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missing Skills Tag Box */}
        <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
            <AlertTriangle className="w-4 h-4" /> Missing Key Tech Stack Skills
          </div>
          <p className="text-[11px] text-neutral-400">
            Adding these requested keywords will boost your ATS resume pass rate:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {missingSkills.map((sk, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#0A0A0A] border border-white/15 text-amber-400 text-xs font-mono font-semibold">
                + {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
            <Sparkles className="w-4 h-4 text-emerald-400" /> AI Recommendations
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-300">
            {resume.improvementSuggestions?.map((sug, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
