import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Sparkles } from 'lucide-react';
import { AnalyticsOverview } from '../../components/analytics/AnalyticsOverview';
import { SpeechStats } from '../../components/analytics/SpeechStats';
import { FacialComposure } from '../../components/analytics/FacialComposure';
import { EmotionTimeline } from '../../components/analytics/EmotionTimeline';
import { AIRoadmap } from '../../components/analytics/AIRoadmap';

export const Analytics = () => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-cyan-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" /> Performance Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Complete Visual Analytics & Biometrics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Comprehensive breakdown of vocal cadence, computer vision eye gaze, STAR technical response depth, and emotion timelines.
          </p>
        </div>
      </div>

      {/* Multidimensional Radar & 7-Day Trend */}
      <AnalyticsOverview />

      {/* Acoustic & Speech Metrics */}
      <SpeechStats />

      {/* Computer Vision Facial & Eye Gaze Analytics */}
      <FacialComposure />

      {/* Emotion & Stress Timeline */}
      <EmotionTimeline />

      {/* AI Career Roadmap */}
      <AIRoadmap />
    </motion.div>
  );
};

export default Analytics;
