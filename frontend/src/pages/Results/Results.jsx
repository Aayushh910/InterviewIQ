import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileQuestion,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Download,
} from 'lucide-react';

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

export const Results = () => {
  const { sessionId: routeSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('id') || searchParams.get('session_id');
  const sessionId = routeSessionId || querySessionId;

  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingEval, setIsGeneratingEval] = useState(false);
  const [error, setError] = useState(null);
  const [pdfDownloadError, setPdfDownloadError] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fetchResults = async (targetSessionId) => {
    if (!targetSessionId) {
      setError('No interview session identifier provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPdfDownloadError(null);

    try {
      const data = await getInterviewResults(targetSessionId);
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
    fetchResults(sessionId);
  }, [sessionId]);

  const handleComputeEvaluation = async () => {
    if (!sessionId) return;
    setIsGeneratingEval(true);
    setError(null);

    try {
      await calculateFinalEvaluation(sessionId, true);
      await fetchResults(sessionId);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Could not generate evaluation for this session. Minimal evidence may be missing.');
    } finally {
      setIsGeneratingEval(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    setIsDownloadingPdf(true);
    setPdfDownloadError(null);

    try {
      const filename = `InterviewIQ_Report_${results?.interview_title ? results.interview_title.replace(/\s+/g, '_') : 'Assessment'}_${sessionId.slice(0, 8)}.pdf`;
      await downloadInterviewReportPdf(sessionId, filename);
    } catch (err) {
      setPdfDownloadError('Failed to generate or download the PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────────
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

  // ─── Evaluation Not Yet Generated State ────────────────────────────────────────
  if (error === 'EVALUATION_NOT_GENERATED') {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl text-center space-y-6 my-12 backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Session Completed — Evaluation Ready</h2>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
            Your interview responses and telemetry have been recorded. Click below to compute your authoritative Phase 12 final evaluation scorecard.
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
                <span>Computing Deterministic Evaluation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Official Scorecard</span>
              </>
            )}
          </button>
          <Link
            to="/history"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141414] text-neutral-300 hover:text-white border border-white/15 text-xs font-mono font-semibold transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  // ─── Unauthorized or Missing State ────────────────────────────────────────────
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
              ? 'You are not authorized to view this interview session. Results are strictly confidential to the session owner.'
              : 'The requested interview session does not exist or may have expired.'}
          </p>
        </div>
        <Link
          to="/interview"
          className="inline-block px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg"
        >
          Return to Interviews
        </Link>
      </div>
    );
  }

  // ─── Generic Error State ──────────────────────────────────────────────────────
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
        <button
          onClick={() => fetchResults(sessionId)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Retrieval
        </button>
      </div>
    );
  }

  // ─── Active Results Dashboard ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Top Navigation & Feedback Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Interview History
        </Link>

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

      {/* 3. "Why did I receive this score?" Section */}
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
};

export default Results;
