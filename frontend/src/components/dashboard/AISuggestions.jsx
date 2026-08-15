import React from 'react';
import { Sparkles, Lightbulb, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AISuggestions = ({ interviews = [] }) => {
  const evaluated = interviews.filter((i) => i.score !== undefined && i.score !== null && Number(i.score) > 0);

  const dynamicSuggestions = [];

  if (evaluated.length > 0) {
    const latestScore = Number(evaluated[0].score);

    if (latestScore < 80) {
      dynamicSuggestions.push({
        title: "Focus on Technical Relevance & Depth",
        description: `Your recent session scored ${latestScore}%. Practice structuring technical answers with concrete architecture details and trade-offs.`,
        actionText: "Practice Technical Loop",
        link: "/interview",
        colorClass: "text-cyan-400 hover:text-cyan-300",
      });
    } else {
      dynamicSuggestions.push({
        title: "Strong Technical Foundation Demonstrated",
        description: `High performance score of ${latestScore}% achieved. Challenge yourself with higher difficulty technical questions.`,
        actionText: "Start Advanced Session",
        link: "/interview",
        colorClass: "text-emerald-400 hover:text-emerald-300",
      });
    }

    dynamicSuggestions.push({
      title: "STAR Behavioral Structure",
      description: "Structure behavioral responses clearly using Situation-Task-Action-Result format for executive interview loops.",
      actionText: "Practice Behavioral Loop",
      link: "/interview",
      colorClass: "text-amber-400 hover:text-amber-300",
    });
  }

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-violet-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            Personalized AI Coach Suggestions
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Actionable feedback derived from your real practice loops</p>
        </div>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-between">
        {dynamicSuggestions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
            <h3 className="text-xs font-bold text-white">No Coaching Suggestions Yet</h3>
            <p className="text-xs text-neutral-400 font-mono">
              Complete a practice interview session to generate personalized AI coaching recommendations.
            </p>
            <div className="pt-2">
              <Link
                to="/interview"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-bold font-mono text-xs hover:bg-neutral-200 transition-colors"
              >
                Start Mock Session <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          dynamicSuggestions.map((item, index) => (
            <div
              key={index}
              className="surface-card p-4 flex flex-col justify-between gap-2"
            >
              <div>
                <h3 className={`text-xs font-bold flex items-center gap-1.5 mb-1 ${item.colorClass}`}>
                  <Sparkles className="w-3.5 h-3.5" /> {item.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
              <Link
                to={item.link}
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold hover:underline self-start mt-1 ${item.colorClass}`}
              >
                {item.actionText} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AISuggestions;
