import React from 'react';
import { HelpCircle, CheckCircle2, Sparkles, MessageSquare, Volume2, Eye } from 'lucide-react';

export const QuestionAnalysisCard = ({ qa, index }) => {
  return (
    <div className="p-5 rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Header Question Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-start gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-[#141414] border border-white/15 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
            Q{index + 1}
          </span>
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            {qa.question}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-bold font-mono shadow-sm">
            Score: {qa.questionScore}%
          </span>
        </div>
      </div>

      {/* User Transcript & AI Suggested Answer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candidate Answer */}
        <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase">
            <span className="flex items-center gap-1 text-white">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Candidate Transcript
            </span>
            <span>WPM: {qa.speechPace || '140 WPM'}</span>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-sans italic">
            "{qa.userAnswer}"
          </p>
        </div>

        {/* AI Suggested Answer */}
        <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/15 space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 uppercase">
            <Sparkles className="w-3.5 h-3.5" /> AI Recommended Response
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {qa.aiSuggestedAnswer}
          </p>
        </div>
      </div>

      {/* Micro Metrics Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10">
          <span className="text-[10px] text-neutral-400 block">Grammar Score</span>
          <span className="font-bold text-emerald-400">{qa.grammar}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10">
          <span className="text-[10px] text-neutral-400 block">Confidence</span>
          <span className="font-bold text-cyan-400">{qa.confidence}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10">
          <span className="text-[10px] text-neutral-400 block">Emotion State</span>
          <span className="font-bold text-purple-400">{qa.emotion}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10">
          <span className="text-[10px] text-neutral-400 block">Eye Contact</span>
          <span className="font-bold text-emerald-400">{qa.facialComposure}</span>
        </div>
      </div>
    </div>
  );
};
