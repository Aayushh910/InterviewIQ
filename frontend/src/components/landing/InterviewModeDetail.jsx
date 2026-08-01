import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Gauge, HelpCircle, CheckCircle2, Sparkles, Cpu, Activity } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const InterviewModeDetail = ({ selectedMode }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedMode.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full"
      >
        <GlassCard className="p-4 sm:p-5 border border-white/25 bg-[#0A0A0A]/95 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Top Metadata Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/15">
            <Badge size="sm" className="px-2.5 py-0.5 font-mono text-[11px] border border-white/25 bg-white/5 text-white">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
              InterviewIQ AI Engine
            </Badge>

            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-neutral-300">
              <div className="flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-md border border-white/20">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{selectedMode.duration}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-md border border-white/20">
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span>{selectedMode.difficulty}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#121212] px-2 py-0.5 rounded-md border border-white/20">
                <HelpCircle className="w-3 h-3 text-purple-400" />
                <span>{selectedMode.questionCount}</span>
              </div>
            </div>
          </div>

          {/* Module Title & Short Detailed Description */}
          <h3 className="text-lg sm:text-xl font-sans font-extrabold text-white mb-1.5 tracking-tight">
            {selectedMode.title}
          </h3>

          <p className="text-neutral-300 text-xs leading-relaxed mb-3 font-normal line-clamp-2">
            {selectedMode.detailedDescription}
          </p>

          {/* Compact Animated Progress / Diagnostic Depth Bar */}
          <div className="mb-3.5 p-2.5 rounded-lg bg-[#121212] border border-white/20">
            <div className="flex justify-between items-center text-[11px] font-mono text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1 font-medium text-white">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                AI Telemetry Depth
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">{selectedMode.progressValue}% Comprehensive</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedMode.progressValue}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-white rounded-full"
              />
            </div>
          </div>

          {/* 6-8 AI-Powered InterviewIQ Features Grid */}
          <div className="mb-4">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>InterviewIQ AI Telemetry Features</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {selectedMode.features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-1.5 px-2 rounded-md bg-[#121212]/90 border border-white/20 text-[11px] text-neutral-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium truncate">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary CTA Button */}
          <Button
            variant="glow"
            size="md"
            className="w-full py-2.5 text-xs sm:text-sm font-bold shadow-xl border border-white/30"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate(`/interview?mode=${selectedMode.id}`)}
          >
            {selectedMode.ctaText}
          </Button>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};
