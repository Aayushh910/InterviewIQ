import React from 'react';
import { motion } from 'framer-motion';
import { Award, Video, Zap, CheckCircle2, Clock } from 'lucide-react';

export const KPICards = ({ stats }) => {
  const hasSessions = stats?.totalSessions > 0;

  const kpis = [
    {
      title: "Overall AI Score",
      value: hasSessions ? stats?.readinessScore : '0.0',
      suffix: "/100",
      change: hasSessions ? "Evaluated Score" : "No sessions completed yet",
      positive: hasSessions,
      icon: Award,
      colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Interviews Completed",
      value: stats?.totalSessions ?? 0,
      suffix: " Sessions",
      change: hasSessions ? "Active Candidate" : "0 completed sessions",
      positive: hasSessions,
      icon: Video,
      colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Average Confidence",
      value: hasSessions ? stats?.avgConfidence : '0.0',
      suffix: "%",
      change: hasSessions ? "Vocal & Facial Composure" : "Awaiting first session",
      positive: hasSessions,
      icon: Zap,
      colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Answer Quality & Depth",
      value: hasSessions ? stats?.avgAnswerQuality : '0.0',
      suffix: "/100",
      change: hasSessions ? "Technical Correctness" : "Not yet evaluated",
      positive: hasSessions,
      icon: CheckCircle2,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Practice Hours",
      value: stats?.totalHours ?? '0.0',
      suffix: " Hours",
      change: hasSessions ? "Recorded Practice Time" : "0.0 hrs recorded",
      positive: hasSessions,
      icon: Clock,
      colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <section className="surface-container p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
            Real-Time AI Competency Matrix
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Track your overall score, completed mock loops, voice confidence, and answer quality benchmarks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="surface-card p-4 flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-neutral-400 truncate">
                  {kpi.title}
                </span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${kpi.colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-sans font-extrabold text-white tracking-tight">
                    {kpi.value}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">{kpi.suffix}</span>
                </div>

                <div className={`flex items-center gap-1 text-[11px] font-mono font-semibold ${kpi.colorClass.split(' ')[0]}`}>
                  <span>{kpi.change}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default KPICards;
