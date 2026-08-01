import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Github, Twitter, Linkedin } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';
import { Button } from '../common/Button';

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-white/15">
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                <Bot className="w-4.5 h-4.5 text-black" />
              </div>
              <span className="font-extrabold text-lg text-white">{APP_NAME}</span>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-sm font-normal leading-relaxed">
              {APP_TAGLINE}. Engineered for software engineers, architects, & tech candidates.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-medium">
              <li><a href="#demo-preview" onClick={(e) => handleNavClick(e, '#demo-preview')} className="hover:text-white transition-colors cursor-pointer">Live Demo</a></li>
              <li><a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition-colors cursor-pointer">AI Features</a></li>
              <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="hover:text-white transition-colors cursor-pointer">How It Works</a></li>
              <li><a href="#interview-types" onClick={(e) => handleNavClick(e, '#interview-types')} className="hover:text-white transition-colors cursor-pointer">Interview Modes</a></li>
              <li><a href="#analytics" onClick={(e) => handleNavClick(e, '#analytics')} className="hover:text-white transition-colors cursor-pointer">Performance Insights</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-medium">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Workspace</Link></li>
              <li><Link to="/interview" className="hover:text-white transition-colors">Mock Room</Link></li>
              <li><Link to="/reports" className="hover:text-white transition-colors">Reports</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">Connect</h4>
            <div className="flex items-center gap-2.5 text-neutral-300">
              <a href="#" className="p-2.5 rounded-xl bg-[#0A0A0A] hover:text-white hover:border-white/50 border border-white/20 transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="p-2.5 rounded-xl bg-[#0A0A0A] hover:text-white hover:border-white/50 border border-white/20 transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="p-2.5 rounded-xl bg-[#0A0A0A] hover:text-white hover:border-white/50 border border-white/20 transition-colors"><Github className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-medium">
          <p>© {new Date().getFullYear()} InterviewIQ Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
