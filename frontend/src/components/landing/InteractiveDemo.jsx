import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Camera, Mic, Activity, Bot, Cpu } from 'lucide-react';
import { AICoreCanvas } from './AICoreCanvas';

export const InteractiveDemo = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [confidenceScore, setConfidenceScore] = useState(87);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const mockTranscript = [
    { text: "When scaling our distributed caching layer, we selected Redis Cluster with consistent hashing...", speaker: "Candidate", confidence: "94%" },
    { text: "We implemented virtual nodes to prevent hot-key memory imbalance under high traffic spikes.", speaker: "Candidate", confidence: "96%" },
    { text: "Can you elaborate on your fallback mechanism during multi-region network partitions?", speaker: "AI Interviewer", confidence: "98%" },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSentenceIndex((prev) => (prev + 1) % mockTranscript.length);
      setConfidenceScore(Math.floor(84 + Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section id="demo-preview" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-300 tracking-tight">
          Real-Time Interview Evaluation
        </h2>
        <p className="text-sm text-neutral-300 mt-2.5 font-medium leading-relaxed">
          Watch how InterviewIQ evaluates speech, facial expressions, and technical answers live.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-[#0A0A0A] shadow-2xl">
        {/* Side-by-Side Dual Interview Video Room: AI Interviewer (Left) vs Candidate (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* AI Interviewer Video Frame */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-white/25 flex flex-col justify-between p-3 aspect-[16/10] sm:aspect-video shadow-xl group">
            {/* Header Overlay */}
            <div className="flex items-center justify-between z-10 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 text-xs font-mono text-white shadow-md">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span className="font-bold tracking-wider">AI INTERVIEWER</span>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                INTERVIEW IN PROGRESS
              </span>
            </div>

            {/* 3D AI Robot Canvas graphic representing the AI interviewer taking the interview */}
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <AICoreCanvas />
            </div>

            {/* AI Speech Wave & Processing Footer Overlay */}
            <div className="relative z-10 bg-black/95 backdrop-blur-md p-2.5 rounded-lg border border-white/20 flex items-center justify-between text-white text-[11px] font-mono shadow-md">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time AI Processing
              </span>
              <div className="flex items-center gap-1 h-3.5">
                {[60, 90, 40, 80, 50, 95, 70, 40].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [`${h}%`, `${Math.max(20, (h + 30) % 100)}%`, `${h}%`] : '20%' }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.05 }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Candidate Stream Frame */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-white/25 flex flex-col justify-between aspect-[16/10] sm:aspect-video shadow-xl group">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80"
              alt="Live Candidate"
              className="w-full h-full object-cover object-[center_12%] opacity-90 transition-transform duration-500 group-hover:scale-[1.01]"
            />

            {/* AI Vision Facial Landmark Mesh Dots */}
            <div className="absolute top-[22%] left-[45%] w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75 pointer-events-none" />
            <div className="absolute top-[28%] left-[48%] w-1.5 h-1.5 rounded-full bg-cyan-400 pointer-events-none" />
            <div className="absolute top-[28%] left-[42%] w-1.5 h-1.5 rounded-full bg-cyan-400 pointer-events-none" />

            {/* Precision Face Bounding Box Overlay */}
            <motion.div
              animate={{
                borderColor: ['rgba(255, 255, 255, 0.4)', 'rgba(52, 211, 153, 0.8)', 'rgba(255, 255, 255, 0.4)'],
                boxShadow: [
                  '0 0 0px rgba(0,0,0,0)',
                  '0 0 15px rgba(52,211,153,0.3)',
                  '0 0 0px rgba(0,0,0,0)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-[12%] left-[30%] w-[40%] h-[55%] border-2 border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-2 backdrop-blur-[1px]"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300 bg-black/90 px-2 py-0.5 rounded-md border border-emerald-500/50 shadow-md">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Eye Contact: 98.4%
                </span>
              </div>
              <div className="text-[10px] font-mono text-white bg-black/90 px-2 py-0.5 rounded-md self-start border border-white/20 shadow-md font-semibold">
                Composure: Calm
              </div>
            </motion.div>

            {/* Top Status Bar Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-2 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/30 text-[10px] font-mono text-white shadow-md">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE FACE ANALYSIS</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-red-500/60 text-[10px] font-mono text-red-400 font-bold shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE CAMERA</span>
              </div>
            </div>

            {/* Candidate Audio Waveform overlay */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/95 backdrop-blur-md p-2.5 rounded-xl border border-white/20 flex items-center justify-between text-white shadow-xl z-10">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono text-neutral-200 font-medium">LIVE VOICE INPUT</span>
              </div>
              <div className="flex items-center gap-1 h-3.5">
                {[40, 75, 35, 95, 55, 85, 65, 45, 100, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [`${h}%`, `${Math.max(20, (h + 35) % 100)}%`, `${h}%`] : '20%' }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.04 }}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-white rounded-full"
                  />
                ))}
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors border border-white/20"
                title={isPlaying ? "Pause Stream" : "Play Stream"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Metrics & Speech Stream Section below dual video room */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2 border-t border-white/15">
          {/* Metrics Column */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-[#121212] border border-white/20 flex flex-col shadow-md">
              <span className="text-[11px] text-neutral-400 font-medium font-mono uppercase">AI Confidence Score</span>
              <span className="text-3xl font-extrabold text-white mt-1">{confidenceScore}%</span>
              <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3" /> Steady Vocal Tone
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#121212] border border-white/20 flex flex-col shadow-md">
              <span className="text-[11px] text-neutral-400 font-medium font-mono uppercase">Speech Pace</span>
              <span className="text-3xl font-extrabold text-white mt-1">142</span>
              <span className="text-[11px] text-neutral-400 mt-1 font-mono">130-150 WPM Target</span>
            </div>
          </div>

          {/* Active Speech Stream */}
          <div className="lg:col-span-8 p-4 rounded-xl bg-[#121212] border border-white/20 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="uppercase tracking-wider">LIVE SPEECH TRANSCRIPT & AI EVALUATION</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed italic font-normal bg-black/40 p-3 rounded-lg border border-white/15">
              "{mockTranscript[currentSentenceIndex].text}"
            </p>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-white/15">
              <span className="font-medium text-white">{mockTranscript[currentSentenceIndex].speaker}</span>
              <span className="text-white font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
                {mockTranscript[currentSentenceIndex].confidence} confidence
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
