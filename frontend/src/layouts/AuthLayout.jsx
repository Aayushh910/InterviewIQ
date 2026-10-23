import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-transparent text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-white selection:text-black">
      {/* Top Navbar Header */}
      <header className="w-full max-w-[1200px] mx-auto flex items-center justify-between z-10 py-3">
        <Logo to="/" size="md" />

        <Link
          to="/"
          className="text-xs font-mono text-neutral-400 hover:text-white transition-colors bg-[#0A0A0A] px-3 py-1.5 rounded-lg border border-[#222222]"
        >
          ← Back to Landing Page
        </Link>
      </header>

      {/* Centered Auth Form Container */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center text-[11px] font-mono text-neutral-600 relative z-10 py-2">
        © {new Date().getFullYear()} InterviewIQ Inc.
      </footer>
    </div>
  );
};
