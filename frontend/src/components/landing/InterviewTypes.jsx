import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code2, Briefcase, Sliders, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const InterviewTypes = () => {
  const navigate = useNavigate();

  const modes = [
    {
      id: "technical",
      title: "1. Technical Interview",
      description: "Deep dive into code logic, technical concepts, problem-solving, and answer clarity.",
      badge: "Popular",
      icon: Code2,
      duration: "45 Mins",
      pills: ["Code Evaluation", "Follow-up Probing", "PDF Report"],
      cta: "Start Technical Interview",
    },
    {
      id: "cv-jd-based",
      title: "2. CV & Job-Based Interview",
      description: "Parses your CV or target Job Description to generate role-specific questions and score job fit.",
      badge: "Role Fit",
      icon: Briefcase,
      duration: "35 Mins",
      pills: ["CV & JD Analysis", "Job Alignment", "PDF Report"],
      cta: "Start CV / Job Interview",
    },
    {
      id: "custom",
      title: "3. Custom Interview",
      description: "Configure custom question topics, difficulty level, and practice at your own pace.",
      badge: "Flexible",
      icon: Sliders,
      duration: "Flexible",
      pills: ["Custom Topics", "Targeted Drills", "PDF Report"],
      cta: "Configure Interview",
    },
  ];

  return (
    <section id="interview-types" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <Badge size="sm" className="mb-3 font-mono px-2.5 py-0.5 text-[10px] bg-[#141414] text-neutral-200 border border-white/20">
          InterviewIQ Execution Modes
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight">
          Select Interview Mode
        </h2>
        <p className="text-neutral-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed max-w-xl mx-auto">
          Choose a tailored mode to practice realistic questions evaluated live by AI.
        </p>
      </div>

      {/* 3-Card Direct Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {modes.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="h-full"
            >
              <div className="h-full p-6 rounded-2xl bg-[#0A0A0A] border border-white/20 hover:border-white/50 transition-all duration-200 flex flex-col justify-between shadow-xl group">
                <div>
                  {/* Top Bar: Icon + Title + Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 text-white flex items-center justify-center shadow-sm group-hover:border-white/40 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 bg-[#121212] px-2 py-0.5 rounded border border-white/15 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {item.duration}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-200 bg-[#141414] px-2 py-0.5 rounded border border-white/20 font-semibold">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-sans font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed font-normal mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Section: Pills + Direct CTA Button */}
                <div>
                  <div className="pt-3 mb-4 border-t border-white/15 flex flex-wrap gap-1.5">
                    {item.pills.map((pill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-300 bg-[#121212] px-2 py-0.5 rounded border border-white/15"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {pill}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/interview?mode=${item.id}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#141414] hover:bg-white hover:text-black border border-white/20 text-white text-xs font-bold font-sans flex items-center justify-center gap-2 transition-all duration-200 shadow-md group/btn cursor-pointer"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
