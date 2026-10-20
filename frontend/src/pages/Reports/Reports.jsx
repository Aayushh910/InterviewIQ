import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Award,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { Badge } from '../../components/common/Badge';
import {
  getInterviewResults,
  downloadInterviewReportPdf,
  calculateFinalEvaluation,
} from '../../services/interviewService';

import { OverallScoreCard } from '../../components/results/OverallScoreCard';
import { PillarsBreakdown } from '../../components/results/PillarsBreakdown';
import { ScoreExplanationCard } from '../../components/results/ScoreExplanationCard';
import { PerQuestionAnalysis } from '../../components/results/PerQuestionAnalysis';
import { StrengthsAndImprovements } from '../../components/results/StrengthsAndImprovements';
import { EvidenceReliabilityCard } from '../../components/results/EvidenceReliabilityCard';
import { ScoringTransparencyCard } from '../../components/results/ScoringTransparencyCard';

export const Reports = () => {
  const { sessionId: routeSessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySessionId = searchParams.get('id') || searchParams.get('session_id');
  const activeSessionId = routeSessionId || querySessionId;

  const { interviews } = useInterview();

  // List view state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  // Detail/Results state
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingEval, setIsGeneratingEval] = useState(false);
  const [error, setError] = useState(null);
  const [pdfDownloadError, setPdfDownloadError] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fetchResults = async (targetId) => {
    if (!targetId) return;

    setIsLoading(true);
    setError(null);
    setPdfDownloadError(null);

    try {
      const data = await getInterviewResults(targetId);
      setResults(data);
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 404 && detail?.includes('Final evaluation has not yet been generated')) {
        setError('EVALUATION_NOT_GENERATED');
      } else if (status === 403) {
        setError('UNAUTHORIZED');
      } else if (status === 404) {
        setError('SESSION_NOT_FOUND');
      } else {
        setError(detail || err?.message || 'Failed to retrieve interview results.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      fetchResults(activeSessionId);
    } else {
      setResults(null);
      setError(null);
    }
  }, [activeSessionId]);

  const handleComputeEvaluation = async () => {
    if (!activeSessionId) return;
    setIsGeneratingEval(true);
    setError(null);

    try {
      await calculateFinalEvaluation(activeSessionId, true);
      await fetchResults(activeSessionId);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Could not generate evaluation for this session. Minimal evidence may be missing.');
    } finally {
      setIsGeneratingEval(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!activeSessionId) return;
    setIsDownloadingPdf(true);
    setPdfDownloadError(null);

    try {
      const filename = `InterviewIQ_Report_${results?.interview_title ? results.interview_title.replace(/\s+/g, '_') : 'Assessment'}_${activeSessionId.slice(0, 8)}.pdf`;
      await downloadInterviewReportPdf(activeSessionId, filename);
    } catch (err) {
      setPdfDownloadError('Failed to generate or download the PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleBackToList = () => {
    setResults(null);
    setError(null);
    navigate('/reports');
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. DETAIL / RESULTS VIEW (when activeSessionId is present)
  // ═══════════════════════════════════════════════════════════════
  if (activeSessionId) {
    if (isLoading) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/20 flex items-center justify-center text-emerald-400 shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Loading Performance Evaluation</h2>
            <p className="text-xs text-neutral-400 font-mono">
              Compiling multimodal telemetry and deterministic scores...
            </p>
          </div>
        </div>
      );
    }

    if (error === 'EVALUATION_NOT_GENERATED') {
      return (
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl text-center space-y-6 my-12 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Session Completed — Evaluation Ready</h2>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
              Your interview responses and telemetry have been recorded. Click below to compute your final evaluation scorecard.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleComputeEvaluation}
              disabled={isGeneratingEval}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-all text-xs font-mono flex items-center justify-center gap-2 shadow-xl border border-white/20 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingEval ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Computing Evaluation...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Generate Official Scorecard</span>
                </>
              )}
            </button>
            <button
              onClick={handleBackToList}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141414] text-neutral-300 hover:text-white border border-white/15 text-xs font-mono font-semibold transition-colors"
            >
              Back to Reports List
            </button>
          </div>
        </div>
      );
    }

    if (error === 'UNAUTHORIZED' || error === 'SESSION_NOT_FOUND') {
      return (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-rose-500/20 shadow-2xl text-center space-y-5 my-16 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              {error === 'UNAUTHORIZED' ? 'Access Restricted' : 'Session Not Found'}
            </h2>
            <p className="text-xs text-neutral-400">
              {error === 'UNAUTHORIZED'
                ? 'You are not authorized to view this interview session.'
                : 'The requested interview report does not exist or may have expired.'}
            </p>
          </div>
          <button
            onClick={handleBackToList}
            className="inline-block px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg"
          >
            Return to Reports
          </button>
        </div>
      );
    }

    if (error || !results) {
      return (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl text-center space-y-5 my-16 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Evaluation Unavailable</h2>
            <p className="text-xs text-neutral-400">{error || 'Could not load interview analysis.'}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchResults(activeSessionId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-neutral-300 font-bold text-xs hover:text-white border border-white/15 transition-all"
            >
              Back to List
            </button>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
      >
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Reports
            </button>
            <span className="text-white/20">|</span>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 hover:underline transition-colors"
            >
              Back to Dashboard →
            </Link>
          </div>

          {pdfDownloadError && (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pdfDownloadError}</span>
            </div>
          )}
        </div>

        {/* 1. Overall Performance Card */}
        <OverallScoreCard
          results={results}
          onDownloadPdf={handleDownloadPdf}
          isDownloadingPdf={isDownloadingPdf}
        />

        {/* 2. Pillars Breakdown */}
        <PillarsBreakdown
          answerQuality={results.answer_quality}
          communication={results.communication}
          visualPresentation={results.visual_presentation}
        />

        {/* 3. Score Explanation */}
        <ScoreExplanationCard
          scoreExplanations={results.score_explanations}
        />

        {/* 4. Per-Question Analysis */}
        <PerQuestionAnalysis
          questions={results.questions}
        />

        {/* 5. Key Strengths & Growth Areas */}
        <StrengthsAndImprovements
          strengths={results.strengths}
          improvements={results.improvements}
        />

        {/* 6. Evidence Coverage & Sensor Reliability */}
        <EvidenceReliabilityCard
          coverage={results.evidence_coverage}
          reliability={results.evidence_reliability}
        />

        {/* 7. Scoring Transparency & Audit */}
        <ScoringTransparencyCard
          transparency={results.transparency}
        />
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. LIST VIEW (Reports & Results Archive)
  // ═══════════════════════════════════════════════════════════════
  const filteredReports = interviews.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || item.typeBadge === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Performance Reports & Results
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Interview Reports & Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            View detailed question-by-question evaluations, answer quality ratings, audio-visual metrics, and PDF exports.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="space-y-3">
        <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by role or title..."
              className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-mono flex-wrap">
            <span className="text-xs text-neutral-400 font-medium">Filter:</span>
            {['All', 'Technical', 'Behavioral', 'HR & Cultural'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDomain === dom
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-[#141414] text-neutral-400 hover:text-white border border-white/15'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <div className="px-1 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Completed Evaluations ({filteredReports.length})
          </h2>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#0A0A0A]/60 border border-white/10 text-center space-y-3">
            <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">No interview reports found matching your search.</p>
            <Link
              to="/interview"
              className="inline-block px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all"
            >
              Start New Interview
            </Link>
          </div>
        ) : (
          filteredReports.map((item, index) => {
            const colorList = [
              { text: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
              { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { text: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ];
            const color = colorList[index % colorList.length];
            const targetId = item.session_id || item.id;

            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {item.title}
                      </h3>
                      <Badge variant="emerald" size="sm" className="bg-[#141414] border-white/20 text-neutral-200 font-mono text-[10px]">
                        {item.typeBadge || 'Technical'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1">{item.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" /> {item.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-4 sm:pt-0 border-t sm:border-0 border-white/10">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-neutral-400 uppercase">AI Score</span>
                    <div className={`text-xl font-extrabold ${color.text}`}>
                      {item.score !== null && item.score !== undefined ? `${Math.round(item.score)}%` : 'Pending'}
                    </div>
                  </div>

                  <Link
                    to={`/reports?id=${targetId}`}
                    className="px-4 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 text-xs shadow-xl border border-white/20 flex items-center gap-1.5 transition-all"
                  >
                    View Scorecard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default Reports;
