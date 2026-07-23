import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { X, Check } from "lucide-react";

const ROWS = [
  "Personalized question generation",
  "Real-time AI feedback",
  "Speech & voice analysis",
  "Confidence & facial analysis",
  "Performance score tracking",
  "Downloadable PDF reports",
  "Personalized learning roadmap",
  "Available 24/7, unlimited sessions",
];

export default function WhyInterviewIQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 bg-[#0F0F14]" aria-label="Why InterviewIQ">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }} className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-[#FF6B6B] uppercase tracking-widest mb-3 bg-[#FF6B6B]/8 px-4 py-1.5 rounded-full border border-[#FF6B6B]/15">
            The Difference
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F4F2EE] tracking-tight mb-4">
            Why InterviewIQ Wins
          </h2>
          <p className="text-[#8B8FA8] text-base max-w-lg mx-auto">
            See how we compare to traditional interview prep methods.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="bg-[#1E1E2E] rounded-2xl border border-white/6 overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-white/6">
            <div className="px-6 py-4 text-xs font-bold text-[#8B8FA8] uppercase tracking-widest">Feature</div>
            <div className="px-6 py-4 text-center border-l border-white/6">
              <span className="text-xs font-semibold text-[#8B8FA8]">Traditional</span>
            </div>
            <div className="px-6 py-4 text-center border-l border-[#F5A623]/20 bg-[#F5A623]/5">
              <span className="text-xs font-bold text-[#F5A623]">InterviewIQ</span>
              <span className="ml-2 text-[9px] bg-[#F5A623] text-[#0F0F14] font-black px-1.5 py-0.5 rounded-full">AI</span>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div key={row} className={`grid grid-cols-3 border-b border-white/4 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
              <div className="px-6 py-4 text-sm text-[#F4F2EE] font-medium">{row}</div>
              <div className="px-6 py-4 flex justify-center items-center border-l border-white/4">
                <div className="w-6 h-6 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center">
                  <X size={12} className="text-[#FF6B6B]" strokeWidth={2.5} />
                </div>
              </div>
              <div className="px-6 py-4 flex justify-center items-center border-l border-[#F5A623]/10 bg-[#F5A623]/[0.03]">
                <div className="w-6 h-6 rounded-full bg-[#A8E063]/15 flex items-center justify-center">
                  <Check size={12} className="text-[#A8E063]" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
