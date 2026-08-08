import React from 'react';
import { Mic, Volume2, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SpeechStats = () => {
  const speechMetrics = [
    { label: "Speaking Pace (WPM)", value: "142 WPM", status: "Optimal (130-150)", icon: Gauge, color: "text-amber-400" },
    { label: "Filler Words Count", value: "3 Total", status: "Low (0.3 / min)", icon: AlertCircle, color: "text-cyan-400" },
    { label: "Vocal Clarity Score", value: "94%", status: "Crystal Clear", icon: Volume2, color: "text-rose-400" },
    { label: "Tone Stability", value: "91%", status: "High Composure", icon: Mic, color: "text-violet-400" },
  ];

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/15 flex items-center justify-center text-violet-400">
          <Mic className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Acoustic & Speech Pattern Metrics
          </h2>
          <p className="text-xs text-neutral-400">Real-time voice modulation, cadence & filler detection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {speechMetrics.map((sm, i) => {
          const Icon = sm.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase">{sm.label}</span>
                <Icon className={`w-4 h-4 ${sm.color}`} />
              </div>
              <div className="text-2xl font-sans font-extrabold text-white dark:text-white light:text-slate-900">
                {sm.value}
              </div>
              <span className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${sm.color}`}>
                <CheckCircle2 className="w-3 h-3" /> {sm.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
