import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Calendar, Clock, CheckCircle2, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { QuestionAnalysisCard } from '../../components/reports/QuestionAnalysisCard';
import { DownloadPDFButton } from '../../components/reports/DownloadPDFButton';

export const ReportDetail = ({ reportIdOverride }) => {
  const [searchParams] = useSearchParams();
  const { getReportById } = useInterview();

  const id = reportIdOverride || searchParams.get('id') || 'int_101';
  const report = getReportById(id);

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Report Not Found</h2>
        <Link to="/reports" className="text-emerald-400 underline text-xs">Back to Reports List</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto print:p-0 print:bg-white print:text-slate-900"
    >
      {/* Back Link & PDF Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to All Reports
        </Link>
        <DownloadPDFButton reportTitle={report.title} />
      </div>

      {/* Main Report Header Card */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
              <FileText className="w-3.5 h-3.5" /> Official AI Performance Report
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-mono">
              <span>Candidate: <strong className="text-white">{report.candidateName}</strong></span>
              <span>Date: <strong>{report.date}</strong></span>
              <span>Duration: <strong>{report.duration}</strong></span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141414] border border-white/15 text-center shrink-0 w-full lg:w-48 shadow-md font-mono">
            <span className="text-[10px] text-neutral-400 uppercase">Overall AI Score</span>
            <div className="text-4xl font-extrabold text-emerald-400">{report.overallScore}%</div>
            <span className="text-[11px] text-emerald-400 font-bold">Top 5% Performance</span>
          </div>
        </div>

        {/* 6 Sub-Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {Object.entries(report.scores || {}).map(([key, val]) => (
            <div key={key} className="p-3 rounded-2xl bg-[#141414]/80 border border-white/10 text-center font-mono">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-lg font-bold text-white dark:text-white light:text-slate-900">{val}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question-wise Analysis */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Question-wise Transcript & AI Evaluation
        </h2>

        <div className="space-y-4">
          {(report.questionAnalysis || []).map((qa, index) => (
            <QuestionAnalysisCard key={index} qa={qa} index={index} />
          ))}
        </div>
      </div>

      {/* AI Recommendations & Growth Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
          </h3>
          <ul className="space-y-2 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              Solid architectural reasoning for Virtual DOM reconciliation and Fiber node scheduling.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              Maintained 95% steady eye contact throughout complex algorithm trade-off questions.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> AI Improvement Tips
          </h3>
          <ul className="space-y-2 text-xs text-neutral-300">
            {(report.aiRecommendations || []).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
