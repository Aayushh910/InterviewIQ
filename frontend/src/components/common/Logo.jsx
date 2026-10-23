import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Official InterviewIQ Logo Mark
 * Candidate (Human in white suit) + AI Interviewer Robot (Teal #2DD4BF)
 */
export const LogoSymbol = ({ className = "w-9 h-9", withContainer = true }) => {
  if (withContainer) {
    return (
      <svg
        className={`shrink-0 ${className}`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="InterviewIQ Brand Mark"
      >
        <rect width="64" height="64" rx="14" fill="#050505" stroke="#1F1F1F" strokeWidth="1.5" />
        <g transform="translate(6.08 9.96) scale(0.72)">
          {/* AI Robot (Teal) */}
          <path d="M34 58V42a6 6 0 0 1 6-6H60a6 6 0 0 1 6 6V58Z" fill="#2DD4BF" />
          <rect x="47" y="31" width="6" height="6" fill="#2DD4BF" />
          <rect x="40" y="16" width="20" height="16" rx="4" fill="#2DD4BF" />
          <rect x="37" y="21" width="3" height="6" rx="1" fill="#2DD4BF" />
          <rect x="60" y="21" width="3" height="6" rx="1" fill="#2DD4BF" />
          <path d="M50 16V10" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="8.5" r="2.5" fill="#2DD4BF" />
          <circle cx="45" cy="24" r="2.3" fill="#050505" />
          <circle cx="55" cy="24" r="2.3" fill="#050505" />
          <rect x="46" y="44" width="12" height="6" rx="1.5" fill="#050505" />

          {/* Human Candidate (White Suit + Tie) */}
          <path d="M6 58C6 44 14 37 24 37C34 37 42 44 42 58Z" fill="#F5F5F5" stroke="#050505" strokeWidth="2.5" />
          <circle cx="24" cy="21" r="9" fill="#F5F5F5" />
          <path d="M18 37.5L24 44L30 37.5" fill="none" stroke="#050505" strokeWidth="2" strokeLinejoin="round" />
          <path d="M24 44L26.5 48L24 57L21.5 48Z" fill="#050505" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="InterviewIQ Brand Mark"
    >
      {/* AI Robot (Teal) */}
      <path d="M34 58V42a6 6 0 0 1 6-6H60a6 6 0 0 1 6 6V58Z" fill="#2DD4BF" />
      <rect x="47" y="31" width="6" height="6" fill="#2DD4BF" />
      <rect x="40" y="16" width="20" height="16" rx="4" fill="#2DD4BF" />
      <rect x="37" y="21" width="3" height="6" rx="1" fill="#2DD4BF" />
      <rect x="60" y="21" width="3" height="6" rx="1" fill="#2DD4BF" />
      <path d="M50 16V10" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="8.5" r="2.5" fill="#2DD4BF" />
      <circle cx="45" cy="24" r="2.3" fill="#050505" />
      <circle cx="55" cy="24" r="2.3" fill="#050505" />
      <rect x="46" y="44" width="12" height="6" rx="1.5" fill="#050505" />

      {/* Human Candidate (White Suit + Tie) */}
      <path d="M6 58C6 44 14 37 24 37C34 37 42 44 42 58Z" fill="#F5F5F5" stroke="#050505" strokeWidth="2.5" />
      <circle cx="24" cy="21" r="9" fill="#F5F5F5" />
      <path d="M18 37.5L24 44L30 37.5" fill="none" stroke="#050505" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 44L26.5 48L24 57L21.5 48Z" fill="#050505" />
    </svg>
  );
};

export const Logo = ({ showText = true, size = "md", to = "/dashboard", className = "", withContainer = true }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* Icon Wrapper with Subtle Hover Glow */}
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <LogoSymbol withContainer={withContainer} className={sizeClasses[size] || sizeClasses.md} />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-sans font-extrabold text-[#F5F5F5] tracking-tight ${textClasses[size] || textClasses.md}`}>
            Interview<span className="text-[#2DD4BF]">IQ</span>
          </div>
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-semibold mt-1">
            AI Platform
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
