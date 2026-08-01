import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, CheckCircle2, Building2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Testimonials = () => {
  const testimonials = [
    {
      quote: "InterviewIQ's Resume-Based interview mode cross-examined my actual CV projects down to the architecture trade-offs. I stopped stuttering and landed a Staff Engineer offer!",
      author: "Elena Rostova",
      role: "Staff Engineer @ Google",
      company: "Google",
      modeUsed: "Resume-Based Interview",
      offerBadge: "Google Staff Offer",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      quote: "The Job Description interview mode matched the exact requirements of Meta's hiring loop. The facial composure and eye contact analysis was game-changing for my confidence.",
      author: "David Chen",
      role: "Senior Engineering Manager @ Meta",
      company: "Meta",
      modeUsed: "Job Description Interview",
      offerBadge: "Meta Senior Offer",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      quote: "The downloadable PDF performance report and speech clarity feedback helped me eliminate filler words before my final executive panel interview. Highly recommended!",
      author: "Sarah Jenkins",
      role: "Principal Architect @ Stripe",
      company: "Stripe",
      modeUsed: "Technical & STAR Loop",
      offerBadge: "Stripe Principal Offer",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section id="testimonials" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative z-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
        <Badge size="sm" className="mb-3 font-mono px-2.5 py-0.5 text-[10px] bg-[#141414] text-neutral-200 border border-white/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
          Verified Offer Success Stories
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight">
          Candidate Outcomes
        </h2>
        <p className="text-neutral-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed max-w-xl mx-auto">
          Engineers and tech leaders who landed top offers after realistic AI interview practice.
        </p>
      </div>

      {/* 3 Testimonial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {testimonials.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full"
          >
            <div className="h-full flex flex-col justify-between p-6 rounded-2xl bg-[#0A0A0A] border border-white/20 hover:border-white/50 transition-all duration-200 shadow-xl group">
              <div>
                {/* Top Card Bar: Rating Stars + Offer Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                    {item.offerBadge}
                  </span>
                </div>

                <Quote className="w-5 h-5 text-neutral-500 mb-3" />
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed italic mb-5 font-normal">
                  "{item.quote}"
                </p>
              </div>

              <div>
                <div className="mb-3 text-[10px] font-mono text-neutral-400 bg-[#121212] px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5 w-fit">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  <span>Mode: {item.modeUsed}</span>
                </div>

                <div className="flex items-center gap-3 pt-3.5 border-t border-white/15">
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className="w-9 h-9 rounded-full object-cover border border-white/30"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{item.author}</h4>
                    <span className="text-[10px] sm:text-xs text-neutral-400 font-mono">{item.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
