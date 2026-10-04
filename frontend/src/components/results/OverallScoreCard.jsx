import React from 'react';
import { Award, Calendar, Clock, Download, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const OverallScoreCard = ({ results, onDownloadPdf, isDownloadingPdf }) => {
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'Exceptional':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Exceptional' };
      case 'Strong':
        return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Strong' };
      case 'Proficient':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Proficient' };
      case 'Developing':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Developing' };
      case 'Needs Improvement':
      default:
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Needs Improvement' };
    }
  };

  const theme = getCategoryTheme(results.performance_category);
  const formattedDate = results.completed_at
    ? new Date(results.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Completed Session';

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Column: Metadata & Header */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Certified Evaluation
            </span>
            <Badge variant="monochrome" size="sm" className="bg-[#141414] border-white/15 text-neutral-300 font-mono text-[11px]">
              {results.interview_type}
            </Badge>
            <Badge variant="monochrome" size="sm" className="bg-[#141414] border-white/15 text-neutral-400 font-mono text-[11px]">
              Report v{results.report_version}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-white tracking-tight">
            {results.interview_title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-mono">
            <span>Candidate: <strong className="text-white">{results.candidate_name}</strong></span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-neutral-500" /> {formattedDate}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-500" /> {results.duration_minutes || 4} Mins</span>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed pt-1">
            {results.evaluation_summary}
          </p>
        </div>

        {/* Right Column: Prominent Score Display & Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 w-full lg:w-64 shrink-0">
          <div className={`w-full p-6 rounded-2xl bg-[#141414] border ${theme.border} text-center font-mono shadow-xl relative overflow-hidden`}>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
              Overall AI Score
            </div>
            <div className={`text-5xl font-extrabold ${theme.text} tracking-tight`}>
              {Math.round(results.overall_score)}%
            </div>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${theme.bg} ${theme.text} border ${theme.border}`}>
                {results.performance_category}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-neutral-500">
              Deterministic Multimodal Synthesis
            </div>
          </div>

          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full px-5 py-3 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-all text-xs font-mono flex items-center justify-center gap-2 shadow-xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Download official interview PDF report"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
