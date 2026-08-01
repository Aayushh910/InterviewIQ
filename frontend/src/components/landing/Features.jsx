import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Mic, Cpu, Bot, Activity, FileCheck, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Features = () => {
  const capabilities = [
    {
      icon: Eye,
      tag: "Eye Contact & Posture",
      subtitle: "Facial & Pose Analysis",
      title: "Facial Expression Analysis",
      description: "Tracks eye contact, posture, facial expressions and confidence during interviews.",
      highlights: ["Eye Contact Ratio", "Composure Index", "Facial Expressions"],
    },
    {
      icon: Mic,
      tag: "130-150 WPM Target",
      subtitle: "Voice & Tone Evaluation",
      title: "Voice & Communication Analysis",
      description: "Evaluates speech clarity, speaking pace, filler words, pronunciation and confidence.",
      highlights: ["Speaking Pace", "Filler Word Detection", "Voice Clarity"],
    },
    {
      icon: Cpu,
      tag: "STAR & Technical Scoring",
      subtitle: "Response Evaluation",
      title: "AI Answer Evaluation",
      description: "Scores technical answers, HR responses, STAR structure and communication quality.",
      highlights: ["Technical Accuracy", "STAR Method", "Response Quality"],
    },
    {
      icon: Bot,
      tag: "Intelligent Follow-ups",
      subtitle: "Adaptive Intelligence",
      title: "Adaptive AI Interviewer",
      description: "Generates intelligent follow-up questions based on previous answers.",
      highlights: ["Follow-up Questions", "Adaptive Probing", "Real-Time Adjustment"],
    },
    {
      icon: Activity,
      tag: "Progress Tracking",
      subtitle: "Interactive Dashboards",
      title: "Performance Analytics",
      description: "Visualises communication, confidence and technical performance using interactive dashboards.",
      highlights: ["Interview Dashboards", "Confidence Charts", "Skill Analysis"],
    },
    {
      icon: FileCheck,
      tag: "Downloadable PDF",
      subtitle: "Personalized Guidance",
      title: "Personalized AI Feedback",
      description: "Generates improvement tips, AI learning roadmap and downloadable PDF reports.",
      highlights: ["Personalized Tips", "AI Learning Roadmap", "Downloadable PDF"],
    },
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative z-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
        <Badge size="sm" className="mb-3 font-mono px-2.5 py-0.5 text-[10px] bg-[#141414] text-neutral-200 border border-white/20">
          InterviewIQ Platform Features
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight">
          AI Interview Intelligence
        </h2>
        <p className="text-neutral-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed max-w-xl mx-auto">
          InterviewIQ evaluates communication, confidence, technical knowledge and behaviour using multimodal AI.
        </p>
      </div>

      {/* 6-Card Feature Grid - Crisp White Outlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {capabilities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="h-full"
            >
              <div className="h-full p-6 rounded-2xl bg-[#0A0A0A] border border-white/20 hover:border-white/50 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group shadow-xl">
                <div>
                  {/* Top Bar: Icon + Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 text-white flex items-center justify-center shadow-sm group-hover:border-white/40 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-300 bg-[#121212] px-2.5 py-0.5 rounded border border-white/20">
                      {item.tag}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    {item.subtitle}
                  </span>

                  <h3 className="text-base font-sans font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed font-normal mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Feature Highlight Pills Footer */}
                <div className="pt-3.5 border-t border-white/15 flex flex-wrap gap-1.5">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-300 bg-[#121212] px-2 py-0.5 rounded border border-white/15"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
