import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Brain, Sparkles } from "lucide-react";
import Button from "../common/Button";
import heroImg from "../../assets/images/11.png";

/* ── 3D mouse-tracking tilt wrapper ── */
function TiltCard({ children, className = "" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 180, damping: 22 });

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Floating badge ── */
function FloatingBadge({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute bg-[#12121A]/90 border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md ${className}`}
      style={{ transform: "translateZ(40px)" }}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-[#0F0F14]"
      aria-label="Hero"
    >
      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#F5A623]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-[#FF6B6B]/4 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-[#A8E063]/3 rounded-full blur-[100px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#F4F2EE" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Copy ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide">
                <Sparkles size={12} />
                AI-Powered Interview Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-[4rem] font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              <span className="text-[#F4F2EE]">Practice.</span>
              <br />
              <span className="text-[#F4F2EE]">Improve.</span>
              <br />
              <span className="shimmer-text">Get Hired.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-base sm:text-lg text-[#8B8FA8] leading-relaxed mb-8 max-w-md"
            >
              InterviewIQ runs real AI mock interviews, analyzes your speech, reads your confidence, and gives you brutally honest feedback — so the real interview feels easy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Button as={Link} to="/signup" variant="primary" size="lg">
                Start Free <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" size="lg">
                <div className="w-4 h-4 rounded-full border-2 border-[#FF6B6B] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
                </div>
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center gap-8"
            >
              {[["10K+", "Interviews Done"], ["95%", "AI Accuracy"], ["4.9★", "Rating"]].map(([val, label]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-2xl font-extrabold text-[#F4F2EE] tracking-tight">{val}</span>
                  <span className="text-xs text-[#8B8FA8] mt-0.5">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Hero image with 3D tilt + floating badges ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <TiltCard className="relative w-full max-w-[540px] mx-auto">

              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#F5A623]/10 via-transparent to-[#FF6B6B]/8 rounded-3xl blur-2xl" />

              {/* Image container */}
              <div
                className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
                style={{ transform: "translateZ(0px)" }}
              >
                {/* Dark overlay at bottom so badges are readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F14]/60 via-transparent to-[#0F0F14]/10 z-10 pointer-events-none rounded-3xl" />

                <img
                  src={heroImg}
                  alt="Person doing an AI-powered mock interview on laptop"
                  className="w-full h-auto object-cover block"
                  draggable={false}
                />

                {/* Live badge — overlaid on image top-right */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#12121A]/80 border border-[#FF6B6B]/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#FF6B6B] tracking-wider">LIVE SESSION</span>
                </div>

                {/* Waveform bar — overlaid bottom */}
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[#12121A]/80 border border-white/8 backdrop-blur-sm px-3 py-2 rounded-xl">
                  <div className="bar-wave flex items-end gap-0.5 h-4">
                    {[4, 7, 5, 9, 6, 8, 4, 7, 5, 6, 8].map((h, i) => (
                      <span key={i} style={{ height: `${h * 10}%`, animationDelay: `${i * 0.09}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8B8FA8] font-medium">Analyzing speech...</span>
                </div>
              </div>

              {/* ── Floating badge: Overall score ── */}
              <FloatingBadge className="p-3.5 -right-8 top-20 w-36" delay={0.9}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={12} className="text-[#A8E063]" />
                  <span className="text-[10px] font-bold text-[#F4F2EE]">Overall Score</span>
                </div>
                <div className="text-3xl font-extrabold text-[#F5A623] leading-none">
                  85<span className="text-sm text-[#8B8FA8] font-semibold">/100</span>
                </div>
                <div className="mt-1.5 text-[9px] font-bold text-[#A8E063]">↑ +12 from last</div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F5A623] rounded-full" style={{ width: "85%" }} />
                </div>
              </FloatingBadge>

              {/* ── Floating badge: AI Tip ── */}
              <FloatingBadge className="p-3.5 -left-8 bottom-28 w-48" delay={1.1}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain size={11} className="text-[#F5A623]" />
                  <span className="text-[9px] font-bold text-[#8B8FA8] uppercase tracking-widest">AI Feedback</span>
                </div>
                <p className="text-[10px] text-[#F4F2EE] leading-relaxed">
                  Strong structure. Add quantifiable results to strengthen your answer.
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#F5A623]" />
                  <span className="text-[9px] text-[#F5A623] font-semibold">Personalized tip</span>
                </div>
              </FloatingBadge>

              {/* ── Floating badge: Skills ── */}
              <FloatingBadge className="p-3 right-0 -bottom-4 w-40" delay={1.3}>
                <p className="text-[9px] font-bold text-[#8B8FA8] uppercase tracking-widest mb-2">Skills</p>
                {[["Technical", 85, "#F5A623"], ["Communication", 80, "#A8E063"], ["Confidence", 83, "#FF6B6B"]].map(([label, val, color]) => (
                  <div key={label} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-[#8B8FA8]">{label}</span>
                      <span className="text-[9px] font-bold" style={{ color }}>{val}</span>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </FloatingBadge>

            </TiltCard>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
