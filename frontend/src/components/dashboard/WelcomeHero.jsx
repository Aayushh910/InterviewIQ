import React from 'react';
import { motion } from 'framer-motion';
import { Video, Play, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';

export const WelcomeHero = ({ userName, activeInterview, readinessScore }) => {
  const numericScore = (readinessScore !== undefined && readinessScore !== null && readinessScore !== 'N/A') ? Number(readinessScore) : 0;
  const hasLiveScore = numericScore > 0;
  
  const scoreBadge = numericScore >= 85 
    ? 'Top 5%' 
    : numericScore >= 70 
    ? 'Top 20%' 
    : numericScore >= 50 
    ? 'Competitive' 
    : hasLiveScore 
    ? 'Developing' 
    : 'New Candidate';

  return (
    <div className="surface-container p-4 sm:p-5 lg:p-6 relative overflow-hidden">
      {/* Ambient Floating Orbs matching Landing */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-white/10 text-neutral-200 text-xs font-mono shadow-md">
            InterviewIQ AI Interview Engine
          </div>

          <h1 className="text-xl sm:text-3xl font-sans font-extrabold text-white tracking-tight leading-tight">
            Ready to master your next interview,{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-300 to-amber-300 bg-clip-text text-transparent">
              {userName || 'Candidate'}
            </span>
            ?
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
            Practice high-stakes technical & behavioral mock loops. Receive live facial composure, voice clarity, and STAR response scoring in real-time.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/interview">
              <Button
                variant="primary"
                size="lg"
                icon={Video}
                className="bg-white text-black font-bold hover:bg-neutral-200 shadow-xl border border-white/20 text-xs sm:text-sm px-6 py-3"
              >
                Start New Interview
              </Button>
            </Link>

            {activeInterview && (
              <Link to={`/interview?resumeSession=${activeInterview.id}`}>
                <Button
                  variant="outline"
                  size="lg"
                  icon={Play}
                  className="border-white/15 hover:border-white/30 text-neutral-200 font-semibold text-xs sm:text-sm px-6 py-3"
                >
                  Continue Active Interview
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Performance Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface-card w-full lg:w-80 p-5 shrink-0"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">AI Readiness</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-bold">
              {scoreBadge}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-sans font-extrabold text-white">
              {hasLiveScore ? readinessScore : '0.0'}
            </span>
            {hasLiveScore ? (
              <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> Evaluated
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-mono">
                Pending evaluation
              </span>
            )}
          </div>

          <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden mb-3 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, numericScore))}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 h-full rounded-full"
            />
          </div>

          <p className="text-[11px] text-neutral-400 leading-tight">
            {hasLiveScore
              ? `Real-time readiness computed from your evaluated practice interview sessions.`
              : 'Complete your first practice interview to generate your live AI readiness benchmark.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
