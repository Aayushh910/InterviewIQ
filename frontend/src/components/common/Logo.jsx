import React from 'react';
import { Link } from 'react-router-dom';

export const LogoSymbol = ({ className = "w-9 h-9" }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Outer Hexagon Shield Gradient */}
      <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1A1A1A" />
        <stop offset="100%" stopColor="#0A0A0A" />
      </linearGradient>

      {/* Emerald Accent Neon Glow */}
      <linearGradient id="emeraldNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>

      {/* Cyan Tech Accent */}
      <linearGradient id="cyanNeonGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>

      {/* Glow Filter */}
      <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer Rounded Container Border */}
    <rect
      x="4"
      y="4"
      width="92"
      height="92"
      rx="24"
      fill="url(#logoBgGrad)"
      stroke="rgba(255, 255, 255, 0.15)"
      strokeWidth="2.5"
    />

    {/* Inner Geometric AI Node Network Shield */}
    <path
      d="M50 18 L78 34 V66 L50 82 L22 66 V34 Z"
      fill="none"
      stroke="url(#emeraldNeonGrad)"
      strokeWidth="3.5"
      strokeLinejoin="round"
      filter="url(#emeraldGlow)"
    />

    {/* Dynamic Core "IQ" Neural Wave / Spark */}
    {/* Letter I / Neural Pillar */}
    <path
      d="M38 36 V64"
      stroke="#FFFFFF"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx="38" cy="30" r="3.5" fill="url(#emeraldNeonGrad)" />

    {/* Letter Q / Tech Node Circuit */}
    <path
      d="M62 36 C55 36 50 42 50 50 C50 58 55 64 62 64 C69 64 74 58 74 50 C74 42 69 36 62 36 Z"
      fill="none"
      stroke="url(#cyanNeonGrad)"
      strokeWidth="4"
    />
    <path
      d="M68 56 L76 66"
      stroke="url(#emeraldNeonGrad)"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Central Pulsing Brain Node Dot */}
    <circle cx="50" cy="50" r="4" fill="#10B981" filter="url(#emeraldGlow)" />
  </svg>
);

export const Logo = ({ showText = true, size = "md", to = "/dashboard", className = "" }) => {
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
      {/* Icon Wrapper with Hover Glow */}
      <div className="relative transition-transform duration-300 group-hover:scale-105">
        <LogoSymbol className={sizeClasses[size] || sizeClasses.md} />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-sans font-extrabold text-white tracking-tight ${textClasses[size] || textClasses.md}`}>
            Interview<span className="text-emerald-400">IQ</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold mt-1">
            AI Platform
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
};

export default Logo;
