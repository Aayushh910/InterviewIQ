import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Sparkles, Activity, ShieldCheck, ChevronDown } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/interviews/create');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between items-center px-4 sm:px-8 lg:px-12 pt-20 sm:pt-24 pb-6 overflow-hidden w-full max-w-[1400px] mx-auto z-10">
      {/* Ambient background lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Main Top Center Content */}
      <div className="w-full flex flex-col items-center text-center my-auto z-10">
        {/* Crisp Outlined Top Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Badge size="md" className="mb-4 px-3 py-1 border border-white/20 bg-[#0A0A0A] shadow-md font-mono text-[11px] text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            InterviewIQ AI Interview Engine
          </Badge>
        </motion.div>

        {/* Concise Direct Title (Smaller, Punchy, Easy to Understand) */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-sans font-extrabold text-white tracking-tight leading-tight mb-4 max-w-4xl"
        >
          Ace Your Next Interview with <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
            Intelligent AI Evaluation
          </span>
        </motion.h1>

        {/* Short & Direct Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs sm:text-base text-neutral-300 mb-7 max-w-xl font-normal leading-relaxed"
        >
          Practice realistic interviews with real-time AI evaluation of your speech, confidence, eye contact, and technical answers.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center gap-3.5 mb-8"
        >
          <Button
            variant="primary"
            size="lg"
            className="px-7 py-3 font-bold shadow-xl text-xs sm:text-sm border border-white/20"
            icon={ArrowRight}
            iconPosition="right"
            onClick={handleStart}
          >
            Start AI Interview
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="px-6 py-3 text-xs sm:text-sm font-semibold border-white/20 hover:border-white/50 text-neutral-200"
            icon={Play}
            iconPosition="left"
            onClick={() => {
              const demoEl = document.getElementById('demo-preview');
              if (demoEl) demoEl.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Watch Live Demo
          </Button>
        </motion.div>
      </div>

      {/* UNIQUE BOTTOM ELEMENT: Unique AI Live Evaluation Status Bar (Fits in Fold) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-3xl p-3.5 sm:p-4 rounded-2xl bg-[#0A0A0A]/95 border border-white/20 shadow-2xl backdrop-blur-xl z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold tracking-wider">AI EVALUATION ENGINE ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center text-[11px] text-neutral-300">
          <span className="px-2 py-0.5 rounded bg-[#141414] border border-white/15">Eye Contact: 98%</span>
          <span className="px-2.5 py-0.5 rounded bg-[#141414] border border-white/15">Speech: 142 WPM</span>
          <span className="px-2.5 py-0.5 rounded bg-[#141414] border border-white/15 text-emerald-400 font-semibold">Confidence: High</span>
        </div>

        <button
          onClick={() => {
            const demoEl = document.getElementById('demo-preview');
            if (demoEl) demoEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>Explore Demo</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
};
