import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Video, Cpu, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Timeline = () => {
  const steps = [
    {
      num: "01",
      icon: FileUp,
      tag: "Personalized Setup",
      title: "Upload Resume or Job Description",
      description: "InterviewIQ analyses your resume or job description and creates personalized interview questions.",
      badgeText: "Instant Setup",
    },
    {
      num: "02",
      icon: Video,
      tag: "Live Simulation",
      title: "Start AI Interview",
      description: "Join a realistic AI interview where speech, facial expressions and communication are analysed live.",
      badgeText: "Realistic Practice",
    },
    {
      num: "03",
      icon: Cpu,
      tag: "Dynamic Feedback",
      title: "AI Evaluation",
      description: "The AI dynamically generates follow-up questions while evaluating technical knowledge, communication and confidence.",
      badgeText: "Adaptive Questions",
    },
    {
      num: "04",
      icon: Award,
      tag: "Actionable Insights",
      title: "Performance Report",
      description: "Receive detailed scores, personalized feedback, AI recommendations and downloadable PDF reports.",
      badgeText: "PDF Report Ready",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative z-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
        <Badge size="sm" className="mb-3 font-mono px-2.5 py-0.5 text-[10px] bg-[#141414] text-neutral-200 border border-white/20">
          4-Step Workflow
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight">
          How InterviewIQ Works
        </h2>
        <p className="text-neutral-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed max-w-xl mx-auto">
          Practice realistic interviews, receive instant AI analysis, and get personalized feedback to land your dream job.
        </p>
      </div>

      {/* Connected 4-Step Pipeline Grid - Crisp White Outlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="h-full"
            >
              <div className="h-full p-6 rounded-2xl bg-[#0A0A0A] border border-white/20 hover:border-white/50 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group shadow-xl">
                {/* Background Watermark Step Number */}
                <span className="absolute right-4 bottom-1 text-7xl font-sans font-extrabold text-white/[0.04] pointer-events-none select-none group-hover:text-white/[0.08] transition-colors duration-200">
                  {step.num}
                </span>

                <div>
                  {/* Step Top Bar: Icon + Step Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 text-white flex items-center justify-center shadow-sm group-hover:border-white/40 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-300 bg-[#121212] px-2 py-0.5 rounded border border-white/20">
                      {step.badgeText}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Step {step.num} • {step.tag}
                  </span>

                  <h3 className="text-base font-sans font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="pt-4 mt-5 border-t border-white/15 flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Stage {step.num}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
