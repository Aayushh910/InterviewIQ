import React from 'react';
import { Link } from 'react-router-dom';
import { Video, FileUp, FileText, Sparkles, ChevronRight } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    {
      title: "New Interview",
      subtitle: "Launch a live technical or HR AI session",
      icon: Video,
      link: "/interview",
      colorClass: "text-cyan-400 group-hover:text-cyan-300",
      bgClass: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Upload Resume",
      subtitle: "Analyze PDF for ATS score & skill gap",
      icon: FileUp,
      link: "/resume",
      colorClass: "text-amber-400 group-hover:text-amber-300",
      bgClass: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "View Reports",
      subtitle: "Review saved interview feedback & PDF",
      icon: FileText,
      link: "/reports",
      colorClass: "text-violet-400 group-hover:text-violet-300",
      bgClass: "bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Resume Analysis",
      subtitle: "Deep-dive keyword & grammar rating",
      icon: Sparkles,
      link: "/resume",
      colorClass: "text-rose-400 group-hover:text-rose-300",
      bgClass: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          Instant Practice Launchpad & Shortcuts
        </h2>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Direct one-click access to launch interviews, upload resumes & view reports
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <Link
              key={index}
              to={act.link}
              className="surface-card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${act.bgClass} ${act.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold text-white transition-colors ${act.colorClass}`}>
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 font-mono">{act.subtitle}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform group-hover:translate-x-1 shrink-0 ${act.colorClass}`} />
            </Link>
          );
        })}
      </div>
    </section>
  );
};
