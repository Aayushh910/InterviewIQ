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
    },
    {
      title: "Upload Resume",
      subtitle: "Analyze PDF for ATS score & skill gap",
      icon: FileUp,
      link: "/resume",
    },
    {
      title: "View Reports",
      subtitle: "Review saved interview feedback & PDF",
      icon: FileText,
      link: "/reports",
    },
    {
      title: "Resume Analysis",
      subtitle: "Deep-dive keyword & grammar rating",
      icon: Sparkles,
      link: "/resume",
    },
  ];

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400">
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
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {act.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 font-mono">{act.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1 shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
};
