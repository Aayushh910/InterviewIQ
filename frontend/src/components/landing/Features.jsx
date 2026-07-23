import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, FileText, Briefcase, Zap, Mic, BarChart3, FileDown, Map } from "lucide-react";

const FEATURES = [
  { icon: Bot, title: "AI Mock Interviews", desc: "Adaptive AI interviewer that evolves questions based on your answers and target role.", color: "#F5A623", glow: "rgba(245,166,35,0.15)" },
  { icon: FileText, title: "Resume-Based", desc: "Upload your resume and get questions that probe your actual experience and skills.", color: "#FF6B6B", glow: "rgba(255,107,107,0.15)" },
  { icon: Briefcase, title: "JD-Based Interviews", desc: "Paste any job description and practice with questions crafted for that exact role.", color: "#A8E063", glow: "rgba(168,224,99,0.15)" },
  { icon: Zap, title: "Real-Time Feedback", desc: "Instant AI feedback on every answer — structure, depth, relevance, and delivery.", color: "#F5A623", glow: "rgba(245,166,35,0.15)" },
  { icon: Mic, title: "Speech Analysis", desc: "Whisper AI transcribes your voice and analyzes pace, clarity, and filler words.", color: "#FF6B6B", glow: "rgba(255,107,107,0.15)" },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track progress over time with detailed charts on technical and communication scores.", color: "#A8E063", glow: "rgba(168,224,99,0.15)" },
  { icon: FileDown, title: "PDF Reports", desc: "Download a comprehensive report with scores, feedback, and improvement areas.", color: "#F5A623", glow: "rgba(245,166,35,0.15)" },
  { icon: Map, title: "Learning Roadmaps", desc: "Personalized study plan based on your weak areas to accelerate interview readiness.", color: "#FF6B6B", glow: "rgba(255,107,107,0.15)" },
];

function FeatureCard({ icon: Icon, title, desc, color, glow, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-3d group relative bg-[#1E1E2E] rounded-2xl border border-white/6 p-6 cursor-default overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 70%)` }} />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `${color}15`, boxShadow: `0 0 20px ${color}20` }}>
          <Icon size={22} style={{ color }} strokeWidth={1.8} />
        </div>
        <h3 className="text-base font-bold text-[#F4F2EE] mb-2">{title}</h3>
        <p className="text-sm text-[#8B8FA8] leading-relaxed">{desc}</p>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at top right, ${color}10, transparent 70%)` }} />
    </motion.article>
  );
}

export default function Features() {
  const headRef = useRef(null);
  const inView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-28 bg-[#0F0F14]" aria-label="Features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div ref={headRef}
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }} className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-3 bg-[#F5A623]/8 px-4 py-1.5 rounded-full border border-[#F5A623]/15">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F4F2EE] tracking-tight mb-4">
            Built for Serious Candidates
          </h2>
          <p className="text-[#8B8FA8] text-base max-w-xl mx-auto leading-relaxed">
            Every feature replicates real interview conditions and gives you the edge you need.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
