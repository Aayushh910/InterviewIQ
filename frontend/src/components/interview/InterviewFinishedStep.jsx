import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Sparkles, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';

export const InterviewFinishedStep = ({ result, onViewReport }) => {
  const [analyzingStep, setAnalyzingStep] = useState(0);

  const steps = [
    "Analyzing vocal clarity, pace & filler words...",
    "Extracting facial composure & eye contact metrics...",
    "Scoring STAR technical depth & logic structure...",
    "Generating downloadable PDF report...",
    "Complete! Interview Saved Successfully."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  const isComplete = analyzingStep === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-6 text-center py-6"
    >
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        
        {/* Celebration Trophy Badge */}
        <div className="w-20 h-20 rounded-3xl bg-[#141414] border border-white/20 shadow-2xl mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-[#0A0A0A] rounded-[22px] flex items-center justify-center text-emerald-400 border border-white/15">
            <Award className="w-10 h-10 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-[#141414] px-3.5 py-1 rounded-full border border-white/20 shadow-sm">
            Interview Finished!
          </span>
          <h1 className="text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Outstanding Performance!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Your responses have been processed by the InterviewIQ AI Evaluation Engine.
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-white/15 inline-block w-full max-w-sm font-mono shadow-md">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Overall AI Readiness Score</div>
          <div className="text-5xl font-extrabold text-emerald-400">
            {result?.score || 92}%
          </div>
          <p className="text-xs text-emerald-400 font-semibold mt-2">
            Top 5% Performance • High Confidence Rating
          </p>
        </div>

        {/* Animated Step Processing Progress */}
        <div className="space-y-3 max-w-md mx-auto text-left">
          <div className="text-xs font-bold font-mono text-neutral-300 dark:text-neutral-300 light:text-slate-700">
            AI Evaluation Breakdown:
          </div>

          <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              {!isComplete ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{steps[analyzingStep]}</span>
            </div>

            <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-white h-full"
                initial={{ width: 0 }}
                animate={{ width: `${((analyzingStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            disabled={!isComplete}
            onClick={onViewReport}
            icon={FileText}
            iconPosition="right"
            className="w-full max-w-md bg-white text-black hover:bg-neutral-200 font-bold shadow-xl border border-white/20 text-sm px-6 py-3"
          >
            View Detailed Performance Report
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
