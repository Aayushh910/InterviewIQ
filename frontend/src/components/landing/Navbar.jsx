import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Menu, X, User, LogOut } from 'lucide-react';
import { NAV_LINKS, APP_NAME } from '../../utils/constants';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

import { Logo } from '../common/Logo';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      // Always show navbar at the absolute top of the page
      if (currentScrollPos < 60) {
        setVisible(true);
      } else {
        // Show navbar when scrolling UP, hide when scrolling DOWN
        setVisible(prevScrollPos > currentScrollPos);
      }

      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: visible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-8 py-3.5"
    >
      <div className="w-full max-w-[1400px] mx-auto rounded-xl px-6 py-3 flex items-center justify-between bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl">
        {/* Brand Logo */}
        <Logo to="/" size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-xs font-medium text-neutral-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Actions (Sign In / Logout / Launch Platform) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-neutral-300 hover:text-white flex items-center gap-2 border border-white/10"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.name || 'Workspace'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-neutral-400 hover:text-white border-white/20"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Open Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-neutral-300 hover:text-white">
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-900 border border-white/20"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 p-5 rounded-xl flex flex-col gap-3 bg-black border border-white/20 shadow-2xl"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-neutral-300 hover:text-white py-1.5 border-b border-white/10 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" className="w-full border-white/20" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full text-red-400" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full border-white/20" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                    Sign In
                  </Button>
                  <Button variant="primary" className="w-full" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
