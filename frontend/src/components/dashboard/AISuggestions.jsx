import React from 'react';
import { Sparkles, Lightbulb, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AISuggestions = () => {
  const suggestions = [
    {
      title: "Elaborate System Trade-offs",
      description: "When answering System Architecture questions, explicitly state trade-offs between Latency vs Throughput.",
      actionText: "Practice Technical Loop",
      link: "/interview",
    },
    {
      title: "Reduce Vocal Filler Words",
      description: "You used 'um' 4 times in your last 10 minutes. Pause for 1 second before answering complex algorithms.",
      actionText: "Run Speech Drill",
      link: "/analytics",
    },
    {
      title: "Enhance Resume Action Verbs",
      description: "Replace passive verbs in your React Experience section with quantified metrics (e.g. 'Engineered state layer reducing render latency by 45%').",
      actionText: "Optimize Resume",
      link: "/resume",
    },
  ];

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            Personalized AI Coach Suggestions
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Tailored action steps from acoustic & vision analytics</p>
        </div>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-between">
        {suggestions.map((item, index) => (
          <div
            key={index}
            className="surface-card p-4 flex flex-col justify-between gap-2"
          >
            <div>
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> {item.title}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {item.description}
              </p>
            </div>
            <Link
              to={item.link}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400 hover:underline self-start mt-1"
            >
              {item.actionText} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};
