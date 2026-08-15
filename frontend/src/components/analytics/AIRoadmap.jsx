import React from 'react';
import { Compass, CheckCircle2, Circle } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';

export const AIRoadmap = () => {
  const { interviews } = useInterview();
  const completedCount = interviews.length;

  const steps = [
    {
      step: 1,
      title: "First AI Practice Loop",
      desc: "Complete your initial mock session with audio STT & camera feed.",
      status: completedCount >= 1 ? "Completed" : "Active",
      progress: completedCount >= 1 ? 100 : 0,
    },
    {
      step: 2,
      title: "STAR Method & Behavioral Mastery",
      desc: "Practice Situation-Task-Action-Result responses across loops.",
      status: completedCount >= 2 ? "Completed" : completedCount === 1 ? "Active" : "Upcoming",
      progress: completedCount >= 2 ? 100 : completedCount === 1 ? 50 : 0,
    },
    {
      step: 3,
      title: "High-Pressure Adaptive Loops",
      desc: "Complete 3+ interview sessions with adaptive counter-questions.",
      status: completedCount >= 3 ? "Completed" : completedCount >= 2 ? "Active" : "Upcoming",
      progress: completedCount >= 3 ? 100 : Math.round((completedCount / 3) * 100),
    },
    {
      step: 4,
      title: "Staff Level Competency",
      desc: "Maintain 85%+ AI evaluation score across multiple interview domains.",
      status: completedCount >= 5 ? "Completed" : "Upcoming",
      progress: completedCount >= 5 ? 100 : 0,
    },
  ];

  const overallProgress = Math.min(100, Math.round((completedCount / 5) * 100));

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
            <p className="text-xs text-neutral-400">Targeted step-by-step path to offer readiness</p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-bold bg-[#141414] px-3 py-1 rounded-full border border-white/20 shadow-sm">
          {overallProgress}% Roadmap Completed
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

export default AIRoadmap;
