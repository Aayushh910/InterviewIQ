import React, { useState } from 'react';
import { Sparkles, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Eye, Mic, Award } from 'lucide-react';
import { Badge } from '../common/Badge';

export const PerQuestionAnalysis = ({ questions }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-8 text-center text-neutral-400 font-mono text-xs">
        No question-level evaluations recorded for this session.
      </div>
    );
  }

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      <div className="px-1 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> Per-Question Performance Analysis ({questions.length})
          </h2>
          <p className="text-xs text-neutral-400">Granular assessment across main questions and counter follow-ups</p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isFollowUp = q.raw_question_type === 'counter';
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-3xl bg-[#0A0A0A]/90 border ${isFollowUp ? 'border-cyan-500/20' : 'border-white/15'} shadow-xl backdrop-blur-xl transition-all overflow-hidden`}
            >
              {/* Question Header Bar */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(idx); }}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className={`w-7 h-7 rounded-xl ${isFollowUp ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'} border text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5`}>
                    Q{q.question_number}
                  </span>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isFollowUp ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300' : 'bg-neutral-900 border-white/20 text-neutral-300'}`}>
                        {q.question_type}
                      </span>
                      {q.evidence_availability?.visual_available && (
                        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 bg-[#141414] px-2 py-0.5 rounded-full border border-white/10">
                          <Eye className="w-3 h-3 text-violet-400" /> Video
                        </span>
                      )}
                      {q.evidence_availability?.behavior_available && (
                        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 bg-[#141414] px-2 py-0.5 rounded-full border border-white/10">
                          <Mic className="w-3 h-3 text-cyan-400" /> Speech
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {q.question_text}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block uppercase">Combined Score</span>
                    <span className="text-base font-extrabold text-emerald-400">{Math.round(q.combined_score)}%</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-neutral-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Detailed Review */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/10">
                  {/* Score metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-3">
                    <div className="p-3 rounded-2xl bg-[#141414] border border-white/10">
                      <span className="text-[10px] text-neutral-400 block">Answer Quality Score</span>
                      <span className="text-sm font-bold text-white">{Math.round(q.answer_score)}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#141414] border border-white/10">
                      <span className="text-[10px] text-neutral-400 block">Communication Score</span>
                      <span className="text-sm font-bold text-cyan-400">
                        {q.communication_score !== null && q.communication_score !== undefined ? `${Math.round(q.communication_score)}%` : 'Renormalized'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#141414] border border-white/10 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-neutral-400 block">Visual Score</span>
                      <span className="text-sm font-bold text-violet-400">
                        {q.visual_score !== null && q.visual_score !== undefined ? `${Math.round(q.visual_score)}%` : 'Renormalized'}
                      </span>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Strengths */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths in this Response
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {q.strengths && q.strengths.length > 0 ? (
                          q.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-neutral-400 italic">Demonstrated structured technical thinking.</li>
                        )}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" /> Growth Recommendations
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {q.improvements && q.improvements.length > 0 ? (
                          q.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <span>{imp}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-neutral-400 italic">Continue practicing comprehensive edge-case analysis.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
