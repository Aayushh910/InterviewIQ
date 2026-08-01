import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, Sparkles, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

export const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isRegister = location.pathname.includes('/register');

  const content = isRegister
    ? {
        badge: "InterviewIQ AI Engine",
        headingLine1: "Start Your Journey",
        headingLine2: "with InterviewIQ",
        tagline: "Practice smart. Get hired faster.",
        features: [
          "Resume & Job Description Matching",
          "Real-Time Speech & Expression AI",
          "Instant Performance & Detailed Reports"
        ]
      }
    : {
        badge: "InterviewIQ AI Engine",
        headingLine1: "Elevate Your",
        headingLine2: "Interview Performance",
        tagline: "Your personal AI interview coach is ready.",
        features: [
          "Personalized Performance Analytics",
          "Comprehensive Interview History",
          "Dynamic AI Practice & Roadmaps"
        ]
      };

  return (
    <div className="min-h-screen w-full bg-transparent text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-white selection:text-black">

      {/* Top Navbar Header */}
      <header className="w-full max-w-[1200px] mx-auto flex items-center justify-between z-10 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-4 h-4 text-black group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <span className="font-sans font-bold text-base text-white tracking-tight">
            {APP_NAME} <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono border border-neutral-800">AI</span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-mono text-neutral-400 hover:text-white transition-colors bg-[#0A0A0A] px-3 py-1.5 rounded-lg border border-[#222222]"
        >
          ← Back to Landing Page
        </Link>
      </header>

      {/* Centered Auth Card Container */}
      <main className="w-full max-w-[1000px] mx-auto my-8 relative z-10">
        <div className="rounded-2xl border border-[#222222] bg-[#0A0A0A]/90 backdrop-blur-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Side: Brand Visual Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#050505] via-[#0A0A0A] to-[#121212] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#222222]">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-neutral-900 text-emerald-400 border border-neutral-800 mb-6">
                <Sparkles className="w-3.5 h-3.5" /> {content.badge}
              </span>

              <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-white leading-tight mb-4 tracking-tight">
                {content.headingLine1} <br />
                <span className="gradient-text">{content.headingLine2}</span>
              </h2>

              <p className="text-sm font-semibold text-neutral-300 leading-relaxed">
                {content.tagline}
              </p>
            </div>

            <div className="space-y-3 my-8">
              {content.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-neutral-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 pt-6 border-t border-[#222222]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>End-to-End Encrypted Interview Data</span>
            </div>
          </div>

          {/* Right Side: Auth Forms */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-black/40">
            {children || <Outlet />}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center text-[11px] font-mono text-neutral-600 relative z-10 py-2">
        © {new Date().getFullYear()} InterviewIQ Inc. Secured with OAuth & JWT authentication.
      </footer>
    </div>
  );
};
