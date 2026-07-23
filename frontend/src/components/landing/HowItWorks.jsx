import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PlusCircle, MessageCircle, Cpu, Download } from "lucide-react";

const STEPS = [
  { icon: PlusCircle, step: "01", title: "Create Your Interview", desc: "Choose Resume-Based, JD-Based, Technical, or HR. Upload your resume or paste a job description.", color: "#F5A623" },
  { icon: MessageCircle, step: "02", title: "Answer AI Questions", desc: "Respond via voice or text to dynamic, context-aware questions. The AI adapts in real-time.", color: "#FF6B6B" },
  { icon: Cpu, step: "03", title: "AI Analyzes Everything", desc: "Technical knowledge, communication, speech patterns, confidence — all evaluated simultaneously.", color: "#A8E063" },
  { icon: Download, step: "04", title: "Download Your Report", desc: "Get a detailed PDF with scores, question-wise feedback, and a personalized learning roadmap.", color: "#F5A623" },
];

function Step({ icon: Icon, step, title, desc, color, index, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-6"
    >
      {/* Step indicator column */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center z-10 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 20px ${color}25` }} />
          <Icon size={22} style={{ color }} strokeWidth={1.8} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-3 min-h-[48px]"
            style={{ background: `linear-gradient(to bottom, ${color}30, transparent)` }} />
        )}
      </div>

      {/* Content */}
      <div className="pb-12 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>{step}</span>
          <div className="h-px flex-1 max-w-[40px]" style={{ background: `${color}30` }} />
        </div>
        <h3 className="text-xl font-bold text-[#F4F2EE] mb-2">{title}</h3>
        <p className="text-sm text-[#8B8FA8] leading-relaxed max-w-sm">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const headRef = useRef(null);
  const inView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-28 bg-[#0A0A0F]" aria-label="How It Works">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div ref={headRef}
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }} className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-[#FF6B6B] uppercase tracking-widest mb-3 bg-[#FF6B6B]/8 px-4 py-1.5 rounded-full border border-[#FF6B6B]/15">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F4F2EE] tracking-tight mb-4">
            From Zero to Interview-Ready
          </h2>
          <p className="text-[#8B8FA8] text-base max-w-lg mx-auto leading-relaxed">
            Four steps to transform your interview performance with the power of AI.
          </p>
        </motion.div>

        <div className="relative max-w-xl mx-auto">
          {STEPS.map((s, i) => <Step key={s.step} {...s} index={i} isLast={i === STEPS.length - 1} />)}
        </div>
      </div>
    </section>
  );
}
