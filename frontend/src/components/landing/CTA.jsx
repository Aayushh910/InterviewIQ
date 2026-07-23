import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import Button from "../common/Button";

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 bg-[#0A0A0F]" aria-label="Call to action">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-[#1E1E2E] rounded-3xl px-8 py-16 sm:px-16 text-center overflow-hidden border border-white/6"
        >
          {/* Glow orbs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#F5A623]/8 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-[#FF6B6B]/6 rounded-full blur-[60px]" />
          </div>

          {/* Decorative grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#F4F2EE" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <Zap size={11} />
              Start practicing today — it's free
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4F2EE] tracking-tight mb-5 leading-tight">
              Ready to Ace Your
              <br />
              <span className="shimmer-text">Next Interview?</span>
            </h2>

            <p className="text-[#8B8FA8] text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of candidates who used InterviewIQ to prepare smarter, build confidence, and land their dream jobs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button as={Link} to="/signup" variant="primary" size="lg">
                Start Free <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" size="lg">
                Book a Demo
              </Button>
            </div>

            <p className="mt-6 text-[#8B8FA8]/50 text-xs">
              No credit card required · Free forever plan available
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
