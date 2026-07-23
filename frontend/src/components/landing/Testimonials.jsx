import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Software Engineer", company: "Hired at Google", avatar: "PS", color: "#F5A623", rating: 5, text: "InterviewIQ completely transformed how I prepared. The AI feedback on my behavioral answers was incredibly specific — it told me exactly where I was vague and how to improve. Got the Google offer after 3 weeks." },
  { name: "Rahul Mehta", role: "Product Manager", company: "Hired at Flipkart", avatar: "RM", color: "#FF6B6B", rating: 5, text: "The JD-based interview feature is a game changer. I pasted the Flipkart PM job description and got questions almost identical to the actual interview. Speech analysis helped me cut filler words by 60%." },
  { name: "Ananya Patel", role: "Data Scientist", company: "Hired at Microsoft", avatar: "AP", color: "#A8E063", rating: 5, text: "I was struggling with technical interviews until I found InterviewIQ. The performance analytics showed exactly which topics I was weak in. The personalized roadmap helped me clear Microsoft in my first attempt." },
  { name: "Karan Joshi", role: "Frontend Developer", company: "Hired at Razorpay", avatar: "KJ", color: "#F5A623", rating: 5, text: "The confidence score feature is brilliant. I didn't realize how much my tone affected interviews. After two weeks of practice, my confidence score went from 62 to 89. Landed Razorpay shortly after." },
  { name: "Sneha Reddy", role: "Backend Engineer", company: "Hired at Swiggy", avatar: "SR", color: "#FF6B6B", rating: 5, text: "The PDF report after each session is incredibly detailed. I could track my progress week over week. The AI follow-up questions really pushed me to think deeper. Best interview prep tool I've used." },
  { name: "Arjun Nair", role: "Full Stack Developer", company: "Hired at Zepto", avatar: "AN", color: "#A8E063", rating: 5, text: "What sets InterviewIQ apart is how it feels like a real interview. The AI doesn't ask generic questions — it follows up based on what you said. That realism made the actual interview feel familiar." },
];

function TestimonialCard({ name, role, company, avatar, color, rating, text, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="card-3d group bg-[#1E1E2E] rounded-2xl border border-white/6 p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Subtle glow */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at top left, ${color}10, transparent 70%)` }} />

      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-sm ${i < rating ? "text-[#F5A623]" : "text-white/10"}`}>★</span>
        ))}
      </div>

      <p className="text-sm text-[#8B8FA8] leading-relaxed flex-1 relative z-10">"{text}"</p>

      <div className="flex items-center gap-3 pt-3 border-t border-white/5 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0F0F14] text-xs font-black flex-shrink-0"
          style={{ background: color }}
        >
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-[#F4F2EE]">{name}</p>
          <p className="text-xs text-[#8B8FA8]">{role} · <span className="font-semibold" style={{ color }}>{company}</span></p>
        </div>
      </div>
    </motion.article>
  );
}

export default function Testimonials() {
  const headRef = useRef(null);
  const inView = useInView(headRef, { once: true, margin: "-80px" });

  return (
    <section id="testimonials" className="py-28 bg-[#0A0A0F]" aria-label="Testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div ref={headRef}
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }} className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-[#A8E063] uppercase tracking-widest mb-3 bg-[#A8E063]/8 px-4 py-1.5 rounded-full border border-[#A8E063]/15">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F4F2EE] tracking-tight mb-4">
            Candidates Who Got Hired
          </h2>
          <p className="text-[#8B8FA8] text-base max-w-lg mx-auto">
            Real results from real people who used InterviewIQ to land their dream jobs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={t.name} {...t} index={i} />)}
        </div>
      </div>
    </section>
  );
}
