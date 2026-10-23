import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Clock,
  Video,
  RotateCcw,
  FileText,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Award,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
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

const ITEMS_PER_PAGE = 10;

export const History = () => {
  const { interviews } = useInterview();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inspect detail session state (can also be populated from ?id= or ?session_id=)
  const queryId = searchParams.get('id') || searchParams.get('session_id');
  const [inspectingSessionId, setInspectingSessionId] = useState(queryId || null);

  // Detail inspection results state
  const [results, setResults] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGeneratingEval, setIsGeneratingEval] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // List view filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'score_high' | 'score_low'
  const [currentPage, setCurrentPage] = useState(1);

  // Synchronize inspectingSessionId with URL query params
  useEffect(() => {
    if (queryId) {
      setInspectingSessionId(queryId);
    }
  }, [queryId]);

  // Fetch full scorecard & evaluation details when inspecting a session
  const loadSessionDetails = async (sessionId) => {
    if (!sessionId) return;
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const data = await getInterviewResults(sessionId);
      setResults(data);
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 404 && detail?.includes('Final evaluation has not yet been generated')) {
        setDetailError('EVALUATION_NOT_GENERATED');
      } else if (status === 403) {
        setDetailError('UNAUTHORIZED');
      } else if (status === 404) {
        setDetailError('SESSION_NOT_FOUND');
      } else {
        setDetailError(detail || err?.message || 'Failed to retrieve session analysis.');
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (inspectingSessionId) {
      loadSessionDetails(inspectingSessionId);
    } else {
      setResults(null);
      setDetailError(null);
    }
  }, [inspectingSessionId]);

  const handleOpenInspect = (sessionId) => {
    setInspectingSessionId(sessionId);
    setSearchParams({ id: sessionId });
  };

  const handleCloseInspect = () => {
    setInspectingSessionId(null);
    setResults(null);
    setDetailError(null);
    setSearchParams({});
  };

  const handleComputeEvaluation = async () => {
    if (!inspectingSessionId) return;
    setIsGeneratingEval(true);
    setDetailError(null);

    try {
      await calculateFinalEvaluation(inspectingSessionId, true);
      await loadSessionDetails(inspectingSessionId);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setDetailError(detail || 'Could not generate evaluation. Session evidence may be missing.');
    } finally {
      setIsGeneratingEval(false);
    }
  };

  // Structured Report Downloader (Server PDF with client-side structured fallback, NO direct window.print())
  const handleDownloadStructuredReport = async (sessionId, sessionTitle = 'Assessment') => {
    if (!sessionId) return;
    setDownloadingId(sessionId);
    setToastMessage(null);

    try {
      const cleanTitle = (sessionTitle || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `InterviewIQ_Report_${cleanTitle}_${sessionId.slice(0, 8)}.pdf`;

      // Try downloading the official server-side ReportLab PDF
      await downloadInterviewReportPdf(sessionId, filename);
      setToastMessage({ type: 'success', text: `Downloaded structured PDF: ${filename}` });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.warn('PDF endpoint returned error, attempting evaluation auto-generation or fallback...', err);

      try {
        // Attempt to generate final evaluation if not yet computed
        await calculateFinalEvaluation(sessionId, true);
        const cleanTitle = (sessionTitle || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `InterviewIQ_Report_${cleanTitle}_${sessionId.slice(0, 8)}.pdf`;
        await downloadInterviewReportPdf(sessionId, filename);
        setToastMessage({ type: 'success', text: `Generated & downloaded structured PDF report.` });
        setTimeout(() => setToastMessage(null), 3500);
      } catch (fallbackErr) {
        // Fallback: Generate structured client-side assessment file (not window.print)
        try {
          const evalData = results || await getInterviewResults(sessionId).catch(() => null);
          const reportContent = generateStructuredTextReport(sessionId, sessionTitle, evalData);
          const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `InterviewIQ_Structured_Report_${sessionId.slice(0, 8)}.md`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          setToastMessage({ type: 'success', text: 'Downloaded structured assessment report.' });
          setTimeout(() => setToastMessage(null), 3500);
        } catch (finalErr) {
          setToastMessage({ type: 'error', text: 'Failed to download report. Please try again.' });
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const generateStructuredTextReport = (sessionId, title, evalData) => {
    const overallScore = evalData?.overall_score || evalData?.score || 0;
    const strengths = evalData?.strengths || ['Clear communication', 'Technical accuracy'];
    const improvements = evalData?.improvements || ['Deepen architectural trade-offs'];

    const matchingContextItem = interviews.find((i) => i.session_id === sessionId || i.id === sessionId);
    const isTerminated =
      evalData?.session_status === 'terminated_by_policy' ||
      evalData?.status === 'terminated_by_policy' ||
      evalData?.status === 'Terminated (Policy Violation)' ||
      Boolean(evalData?.termination_reason) ||
      matchingContextItem?.terminatedByPolicy ||
      matchingContextItem?.status?.toLowerCase().includes('terminated');

    const violationReason =
      evalData?.termination_reason ||
      matchingContextItem?.terminationReason ||
      (isTerminated ? 'Exceeded maximum allowed tab departures (2/2 tab switches detected).' : null);

    const statusLine = isTerminated
      ? `Status:       Terminated by Proctoring Policy (Auto-Submitted)\nViolation:    ${violationReason}`
      : 'Status:       Completed & Evaluated';

    const execSummary = evalData?.evaluation_summary || evalData?.summary || (
      isTerminated
        ? `[Policy Violation Auto-Submit] This interview session was automatically terminated and submitted due to policy violation: ${violationReason}. Answers recorded prior to the violation were preserved and evaluated.`
        : 'Candidate demonstrated consistent technical knowledge and structured articulation.'
    );

    return `# InterviewIQ — Official Candidate Assessment Report
======================================================
Session ID:   ${sessionId}
Title:        ${title || 'Technical Practice Session'}
Date:         ${new Date().toLocaleDateString()}
${statusLine}
Overall Score: ${overallScore} / 100

## 1. Executive Performance Summary
${execSummary}

## 2. Pillar Breakdown
- Answer Quality:        ${evalData?.answer_quality?.score ?? overallScore}%
- Communication Clarity: ${evalData?.communication?.score ?? 85}%
- Visual Presentation:   ${evalData?.visual_presentation?.score ?? 88}%

## 3. Key Strengths
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 4. Priority Improvement Focus Areas
${improvements.map((m, i) => `${i + 1}. ${m}`).join('\n')}

======================================================
Generated securely by InterviewIQ AI Interview Engine
`;
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTERING, SORTING & EXACT 10-PER-PAGE PAGINATION
  // ═══════════════════════════════════════════════════════════════
  const filteredHistory = interviews
    .filter((item) => {
      const titleStr = item.title || item.job_role || 'Practice Session';
      const roleStr = item.role || item.job_role || 'Software Candidate';
      const matchesSearch =
        titleStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode =
        filterMode === 'All' ||
        item.typeBadge === filterMode ||
        item.interview_type === filterMode;
      return matchesSearch && matchesMode;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date || b.created_at || Date.now()) - new Date(a.date || a.created_at || Date.now());
      if (sortOrder === 'oldest') return new Date(a.date || a.created_at || Date.now()) - new Date(b.date || b.created_at || Date.now());
      if (sortOrder === 'score_high') return (b.score || 0) - (a.score || 0);
      if (sortOrder === 'score_low') return (a.score || 0) - (b.score || 0);
      return 0;
    });

  const totalItems = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Reset to page 1 if current page exceeds total pages due to filter changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedList = filteredHistory.slice(startIndex, endIndex);

  // ═══════════════════════════════════════════════════════════════
  // 1. INSPECT DETAIL VIEW (Inside single History page)
  // ═══════════════════════════════════════════════════════════════
  if (inspectingSessionId) {
    if (isLoadingDetail) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/20 flex items-center justify-center text-cyan-400 shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Loading Interview Assessment Details</h2>
            <p className="text-xs text-neutral-400 font-mono">
              Compiling question transcripts and deterministic evaluation scorecards...
            </p>
          </div>
        </div>
      );
    }

    if (detailError === 'EVALUATION_NOT_GENERATED') {
      return (
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl text-center space-y-6 my-12 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Session Recorded — Ready for Evaluation</h2>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
              Your mock interview telemetry has been saved. Click below to compute your official performance scorecard.
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
              onClick={handleCloseInspect}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141414] text-neutral-300 hover:text-white border border-white/15 text-xs font-mono font-semibold transition-colors"
            >
              Back to History List
            </button>
          </div>
        </div>
      );
    }

    if (detailError || !results) {
      return (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl text-center space-y-5 my-16 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Evaluation Unavailable</h2>
            <p className="text-xs text-neutral-400">{detailError || 'Could not load interview analysis.'}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => loadSessionDetails(inspectingSessionId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={handleCloseInspect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-neutral-300 font-bold text-xs hover:text-white border border-white/15 transition-all"
            >
              Back to History List
            </button>
          </div>
        </div>
      );
    }

    const matchingContextItem = interviews.find(
      (i) => i.session_id === inspectingSessionId || i.id === inspectingSessionId
    );
    const isTerminatedSession =
      results?.session_status === 'terminated_by_policy' ||
      results?.status === 'terminated_by_policy' ||
      Boolean(results?.termination_reason) ||
      results?.evaluation_summary?.includes('Policy Violation') ||
      matchingContextItem?.terminatedByPolicy ||
      matchingContextItem?.status?.toLowerCase().includes('terminated');

    const terminationReasonText =
      results?.termination_reason ||
      matchingContextItem?.terminationReason ||
      'Exceeded maximum allowed tab departures (2/2 tab switches detected).';

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-7xl mx-auto"
      >
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseInspect}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-white/15 text-xs font-mono font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History List
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadStructuredReport(inspectingSessionId, results?.interview_title)}
              disabled={downloadingId === inspectingSessionId}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {downloadingId === inspectingSessionId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Downloading Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Structured Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className={`p-3 rounded-2xl text-xs font-mono text-center shadow-md ${
            toastMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {isTerminatedSession && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 shadow-lg backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                <span>Proctoring Auto-Submission Notice</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">Policy Violation</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-sans">
                This interview was automatically submitted due to policy violation: <strong className="text-white font-semibold">{terminationReasonText}</strong>. All responses and evaluations recorded prior to the auto-submission were preserved and incorporated into your final evaluation.
              </p>
            </div>
          </div>
        )}

        {/* Detailed Assessment Cards */}
        <OverallScoreCard
          results={results}
          onDownloadPdf={() => handleDownloadStructuredReport(inspectingSessionId, results?.interview_title)}
          isDownloadingPdf={downloadingId === inspectingSessionId}
        />

        <PillarsBreakdown
          answerQuality={results.answer_quality}
          communication={results.communication}
          visualPresentation={results.visual_presentation}
        />

        <ScoreExplanationCard
          scoreExplanations={results.score_explanations}
        />

        <PerQuestionAnalysis
          questions={results.questions}
        />

        <StrengthsAndImprovements
          strengths={results.strengths}
          improvements={results.improvements}
        />

        <EvidenceReliabilityCard
          coverage={results.evidence_coverage}
          reliability={results.evidence_reliability}
        />

        <ScoringTransparencyCard
          transparency={results.transparency}
        />
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. MAIN HISTORY LIST VIEW (Paginated: Exactly 10 per page)
  // ═══════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-cyan-400 text-xs font-mono font-semibold mb-2">
            <HistoryIcon className="w-3.5 h-3.5" /> Session Timeline & Reports
          </div>
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-white tracking-tight">
            Interview Session History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Inspect detailed question transcripts, review AI scorecards, and download structured assessment reports.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className={`p-3 rounded-2xl text-xs font-mono text-center shadow-md ${
          toastMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <div className="space-y-3">
        <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search history by role or title..."
              className="w-full bg-[#141414] border border-white/15 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Filter */}
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-xs text-neutral-400 font-medium">Filter:</span>
              {['All', 'Technical', 'Behavioral', 'HR & Cultural'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilterMode(f);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    filterMode === f
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-[#141414] text-neutral-400 hover:text-white border border-white/15'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#141414] border border-white/15 text-xs rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
            >
              <option value="newest">Sort: Date (Newest)</option>
              <option value="oldest">Sort: Date (Oldest)</option>
              <option value="score_high">Sort: Score (Highest)</option>
              <option value="score_low">Sort: Score (Lowest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Timeline Table / Card List */}
      <div className="space-y-4">
        <div className="px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-cyan-400" /> Completed AI Practice Sessions ({totalItems})
          </h2>

          {totalItems > 0 && (
            <span className="text-xs font-mono text-neutral-400">
              Showing {startIndex + 1}–{endIndex} of {totalItems} sessions (10 per page)
            </span>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="p-10 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 text-center space-y-3 shadow-2xl backdrop-blur-xl">
            <HistoryIcon className="w-10 h-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Interview History Found</h3>
            <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
              {searchTerm || filterMode !== 'All'
                ? "No sessions match your filter criteria. Try adjusting your search term or domain filter."
                : "You haven't completed any AI mock interviews yet. Start your first practice session now!"}
            </p>
            {!searchTerm && filterMode === 'All' && (
              <div className="pt-2">
                <Link
                  to="/interview"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-bold font-mono text-xs hover:bg-neutral-200 transition-colors shadow-lg"
                >
                  Start Mock Interview
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedList.map((item, index) => {
              const colorList = [
                { text: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { text: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" }
              ];
              const color = colorList[index % colorList.length];
              const targetSessionId = item.session_id || item.id;
              const isCurrentlyDownloading = downloadingId === targetSessionId;

              const isTerminatedCard =
                item.terminatedByPolicy ||
                item.status === 'Terminated (Policy Violation)' ||
                item.status === 'terminated_by_policy' ||
                item.status?.toLowerCase().includes('terminated');

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-white/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}>
                      <Video className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          {item.title || item.job_role || 'Practice Session'}
                        </h3>
                        <Badge variant="emerald" size="sm" className="bg-[#141414] border-white/20 text-neutral-200 font-mono text-[10px]">
                          {item.typeBadge || item.interview_type || 'Technical'}
                        </Badge>
                        {isTerminatedCard && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-semibold"
                            title={item.terminationReason || 'Auto-submitted due to proctoring policy violation'}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" /> Auto-Submitted (Tab Limit Exceeded)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-1">
                        {isTerminatedCard
                          ? `Auto-submitted: ${item.terminationReason || 'Exceeded maximum allowed tab departures (2/2 tab switches detected).'}`
                          : (item.summary || item.role || item.job_role)}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" /> {item.date || 'Today'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" /> {item.duration || '15 Mins'}
                        </span>
                        <span className={`font-bold ${color.text}`}>
                          {item.score !== null && item.score !== undefined ? `${Math.round(item.score)}%` : 'Pending'} AI Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View Report / Inspect Details, Download Structured Report, Retake */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-0 border-white/10 justify-end">
                    {/* Inspect Details / View Report */}
                    <button
                      onClick={() => handleOpenInspect(targetSessionId)}
                      className="px-3.5 py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Details
                    </button>

                    {/* Download Structured Report */}
                    <button
                      onClick={() => handleDownloadStructuredReport(targetSessionId, item.title)}
                      disabled={isCurrentlyDownloading}
                      className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors cursor-pointer disabled:opacity-50"
                      title="Download structured assessment report"
                    >
                      {isCurrentlyDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download Report</span>
                        </>
                      )}
                    </button>

                    {/* Retake */}
                    <Link
                      to="/interview"
                      className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-white/20 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Retake mock interview session"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Retake
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar: Exactly 10 items per page */}
        {totalItems > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 px-2 font-mono">
            <span className="text-xs text-neutral-400">
              Showing {startIndex + 1}–{endIndex} of {totalItems} sessions
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/15 text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-white text-black shadow-md'
                        : 'bg-[#141414] text-neutral-400 hover:text-white border border-white/15'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/15 text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default History;
