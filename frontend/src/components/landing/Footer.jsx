import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';

export const Footer = () => {
  const navigate = useNavigate();

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="relative bg-black border-t border-white/20 pt-16 pb-12 px-4 sm:px-8 lg:px-12">
      <div className="w-full max-w-[1400px] mx-auto relative z-10">
        {/* Pre-footer Box - Crisp White Border */}
        <div className="rounded-2xl p-8 sm:p-10 border border-white/20 bg-[#0A0A0A] mb-16 text-center shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-sans font-extrabold text-white mb-3 tracking-tight">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-neutral-300 max-w-lg mx-auto text-xs sm:text-sm mb-6 font-medium leading-relaxed">
            Join thousands of candidates preparing with realistic AI interview simulations.
          </p>
          <div className="flex items-center justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/auth')}
            >
              Start Free Practice
            </Button>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/15">
          <div className="md:col-span-2 flex flex-col gap-3">
            <Logo to="/" size="md" />
            <p className="text-neutral-400 text-xs sm:text-sm max-w-sm font-normal leading-relaxed">
              {APP_TAGLINE}. Engineered for tech candidates and engineering interviews.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">Features</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-medium">
              <li><a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition-colors cursor-pointer">AI Capabilities</a></li>
              <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="hover:text-white transition-colors cursor-pointer">How It Works</a></li>
              <li><a href="#interview-types" onClick={(e) => handleNavClick(e, '#interview-types')} className="hover:text-white transition-colors cursor-pointer">Interview Modes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-medium">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/interview" className="hover:text-white transition-colors">Start Interview</Link></li>
              <li><Link to="/history" className="hover:text-white transition-colors">History & Reports</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-medium">
          <p>© {new Date().getFullYear()} InterviewIQ Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
