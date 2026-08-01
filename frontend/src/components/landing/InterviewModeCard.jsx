import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Briefcase, Code2, Users, Building2, Sliders, Sparkles, Check } from 'lucide-react';
import { Badge } from '../common/Badge';

const iconMap = {
  FileText: FileText,
  Briefcase: Briefcase,
  Code2: Code2,
  Users: Users,
  Building2: Building2,
  Sliders: Sliders,
};

export const InterviewModeCard = ({ mode, isSelected, onSelect }) => {
  const Icon = iconMap[mode.icon] || Sparkles;

  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ scale: 1.01, x: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-md relative overflow-hidden group ${
        isSelected
          ? 'bg-[#0E0E0E] border-white shadow-glow-white z-10'
          : 'bg-[#0A0A0A] border-white/20 hover:border-white/50 hover:bg-[#121212]'
      }`}
    >
      {/* Active Indicator Bar on left border */}
      {isSelected && (
        <motion.div
          layoutId="activeSideBar"
          className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
        />
      )}

      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Monochromatic Dark Icon Container */}
        <div
          className={`w-8.5 h-8.5 rounded-lg bg-[#181818] border border-white/20 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:bg-neutral-800 transition-colors duration-200`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`font-sans font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-white font-extrabold' : 'text-neutral-200'}`}>
              {mode.title}
            </h3>
            {mode.badge && (
              <Badge
                variant="neutral"
                size="sm"
                className="py-0 px-1.5 text-[9px] bg-[#141414] text-neutral-200 border border-white/20"
              >
                {mode.badge}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1 font-normal leading-tight">
            {mode.shortDescription}
          </p>
        </div>
      </div>

      <div className="shrink-0 ml-2">
        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/30 shadow-sm">
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 group-hover:bg-white transition-colors" />
        )}
      </div>
    </motion.div>
  );
};
