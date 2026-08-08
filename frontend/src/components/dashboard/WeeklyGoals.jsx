import React from 'react';
import { Target, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const WeeklyGoals = () => {
  const goals = [
    { title: "Complete 3 Technical Interviews", current: 3, target: 3, completed: true, colorClass: "text-cyan-400" },
    { title: "Achieve 90%+ Voice Clarity Score", current: 92, target: 90, completed: true, colorClass: "text-emerald-400" },
    { title: "Practice 2 HR & Behavioral Loops", current: 1, target: 2, completed: false, colorClass: "text-violet-400" },
    { title: "Maintain 7-Day Practice Streak", current: 5, target: 7, completed: false, colorClass: "text-amber-400" },
  ];

  const overallProgress = Math.round((goals.filter(g => g.completed).length / goals.length) * 100);

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-amber-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Weekly Practice Goals & Milestones
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{overallProgress}% of target milestone reached</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-sm">
            5 Day Streak 🔥
          </span>
        </div>

        {/* Main Goal Progress Bar */}
        <div className="w-full bg-[#1A1A1A] rounded-full h-2.5 overflow-hidden mb-4 border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full"
          />
        </div>

        <div className="space-y-2">
          {goals.map((g, i) => (
            <div key={i} className="surface-card p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${g.completed ? g.colorClass : 'text-neutral-600'}`} />
                <span className={g.completed ? 'line-through text-neutral-500 font-sans' : 'text-neutral-200 font-medium font-sans'}>
                  {g.title}
                </span>
              </div>
              <span className={`font-mono text-[11px] font-semibold ${g.colorClass}`}>
                {g.current}/{g.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
