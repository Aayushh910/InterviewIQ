import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { value: 10000, suffix: "+", label: "Mock Interviews", icon: "🎯" },
  { value: 95, suffix: "%", label: "AI Accuracy Rate", icon: "🤖" },
  { value: 4.9, suffix: "★", label: "Average Rating", icon: "⭐" },
  { value: 500, suffix: "+", label: "Companies Supported", icon: "🏢" },
];

function Counter({ value, suffix, decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(current);
    }, 1800 / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();
  return <span ref={ref} className="tabular-nums">{display}{suffix}</span>;
}

export default function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 bg-[#0F0F14] relative overflow-hidden" aria-label="Statistics">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-[#F5A623]/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STATS.map(({ value, suffix, label, icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-3d bg-[#1E1E2E] border border-white/6 rounded-2xl p-6 text-center group"
            >
              <div className="text-2xl mb-3">{icon}</div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#F5A623] mb-2 tracking-tight">
                <Counter value={value} suffix={suffix} decimals={value % 1 !== 0 ? 1 : 0} />
              </div>
              <div className="text-sm text-[#8B8FA8] font-medium">{label}</div>
              <div className="mt-3 w-8 h-0.5 bg-[#F5A623]/40 mx-auto rounded-full group-hover:w-16 transition-all duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
