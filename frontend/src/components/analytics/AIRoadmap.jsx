import React from 'react';
import { Compass, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const AIRoadmap = () => {
  const steps = [
    {
      step: 1,
      title: "Mastering Technical Foundations",
      desc: "Deep dive into Virtual DOM, state normalization & memory management.",
      status: "Mastered",
      progress: 100,
      color: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
    },
    {
      step: 2,
      title: "STAR Behavioral & Leadership Fluency",
      desc: "Structuring Situation-Task-Action-Result responses for executive loops.",
      status: "In Progress",
      progress: 85,
      color: "border-cyan-500 bg-cyan-500/10 text-cyan-400",
    },
    {
      step: 3,
      title: "Live High-Pressure AI Mock Loops",
      desc: "Adaptive counter-questioning under 30-minute timed conditions.",
      status: "Active",
      progress: 60,
      color: "border-amber-500 bg-amber-500/10 text-amber-400",
    },
    {
      step: 4,
      title: "Executive Composure & Offer Negotiation",
      desc: "Refining vocal pitch, compensation negotiation & closing strategies.",
      status: "Upcoming",
      progress: 0,
      color: "border-slate-800 bg-slate-950 text-slate-500",
    },
  ];

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/15 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Personalized AI Career Roadmap
            </h2>
            <p className="text-xs text-neutral-400">Targeted step-by-step path to Staff Engineer / Lead offer readiness</p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-bold bg-[#141414] px-3 py-1 rounded-full border border-white/20 shadow-sm">
          65% Roadmap Completed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((st) => (
          <div
            key={st.step}
            className="p-4 rounded-2xl border border-white/15 bg-[#141414]/80 flex flex-col justify-between space-y-3 relative"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Step 0{st.step}</span>
                {st.progress === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-500" />
                )}
              </div>
              <h3 className="text-xs font-bold text-white dark:text-white light:text-slate-900 mb-1">
                {st.title}
              </h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">{st.desc}</p>
            </div>

            <div>
              <div className="w-full bg-[#0A0A0A] rounded-full h-1.5 overflow-hidden mb-2 border border-white/10">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${st.progress}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">{st.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
