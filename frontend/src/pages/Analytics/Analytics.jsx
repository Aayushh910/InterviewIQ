import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AnalyticsOverview } from '../../components/analytics/AnalyticsOverview';
import { SpeechStats } from '../../components/analytics/SpeechStats';
import { FacialComposure } from '../../components/analytics/FacialComposure';

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
            <BarChart3 className="w-3.5 h-3.5" /> Candidate Mastery & Growth Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white tracking-tight">
            Performance & Improvement Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Longitudinal growth analysis tracking your technical answer depth, speech pacing, vocal clarity, and facial composure stability.
          </p>
        </div>
      </div>

      {/* Multidimensional Radar & Score Progression */}
      <AnalyticsOverview />

      {/* Acoustic & Speech Transcription Metrics */}
      <SpeechStats />

      {/* Computer Vision Facial Presence & Pose Tracking */}
      <FacialComposure />
    </motion.div>
  );
};

export default Analytics;
