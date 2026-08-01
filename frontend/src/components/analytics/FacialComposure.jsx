import React from 'react';
import { Eye, ScanFace, Smile, ShieldCheck } from 'lucide-react';

export const FacialComposure = () => {
  const facialMetrics = [
    { label: "Eye Contact Score", value: "95%", desc: "Direct gaze maintained during technical explanations" },
    { label: "Posture & Head Stability", value: "92%", desc: "Upright shoulder posture with minimal micro-tilts" },
    { label: "Expression State", value: "Focused", desc: "Attentive, engaged & neutral under pressure" },
    { label: "Micro-Frown Detection", value: "0.2 / min", desc: "No signs of nervousness or confusion" },
  ];

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/15 flex items-center justify-center text-cyan-400">
          <ScanFace className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Facial Vision AI & Eye Gaze Analytics
          </h2>
          <p className="text-xs text-neutral-400">Computer vision tracking head stability and facial poise</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {facialMetrics.map((fm, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">{fm.label}</span>
            <div className="text-xl font-sans font-extrabold text-cyan-400">{fm.value}</div>
            <p className="text-[11px] text-neutral-400">{fm.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
