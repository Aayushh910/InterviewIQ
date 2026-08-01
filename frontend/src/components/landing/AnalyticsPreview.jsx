import React from 'react';
import { motion } from 'framer-motion';
import { Award, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '../common/Badge';

export const AnalyticsPreview = () => {
  const insights = [
    {
      icon: Award,
      title: "Strong Technical Performance",
      description: "Excellent problem-solving ability with clear structured answer logic.",
      metric: "96% Accuracy",
    },
    {
      icon: AlertTriangle,
      title: "Communication Improvement",
      description: "Speech pace target (140 WPM) & reduced filler words during complex answers.",
      metric: "Pace Target Met",
    },
    {
      icon: TrendingUp,
      title: "Confidence Growth",
      description: "+18% confidence score increase across your recent interview sessions.",
      metric: "+18% Growth",
    },
  ];

  return (
    <section id="analytics" className="py-16 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto relative z-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <Badge size="sm" className="mb-3 font-mono px-2.5 py-0.5 text-[10px] bg-[#141414] text-neutral-200 border border-white/20">
          <Activity className="w-3 h-3 text-emerald-400 mr-1" />
          AI Feedback & Growth
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-white tracking-tight">
          AI Performance Insights
        </h2>
        <p className="text-neutral-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed max-w-xl mx-auto">
          Receive detailed AI-generated feedback after every interview session.
        </p>
      </div>

      {/* Clean 3-Card Non-Expanded Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="h-full"
            >
              <div className="h-full p-6 rounded-2xl bg-[#0A0A0A] border border-white/20 hover:border-white/50 transition-all duration-200 flex flex-col justify-between shadow-xl group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 text-white flex items-center justify-center shadow-sm group-hover:border-white/40 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      {item.metric}
                    </span>
                  </div>

                  <h3 className="text-base font-sans font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
