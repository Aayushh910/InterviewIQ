import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sun, Moon, User, LogOut, ChevronRight
} from 'lucide-react';
import { Sidebar, SIDEBAR_PRIMARY, SIDEBAR_SECONDARY } from '../components/layout/Sidebar';
import { LogoutModal } from '../components/common/LogoutModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLenis } from '../hooks/useLenis';
import { APP_NAME } from '../utils/constants';
import { Logo } from '../components/common/Logo';

export const WorkspaceLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const mainRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Helper to extract clean initials (e.g., Aayush Savaliya -> AS)
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'AS';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Initialize smooth Lenis scroll targeting the workspace main scroll container
  const lenisRef = useLenis({ wrapper: mainRef });

  // Reset scroll position on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleSidebarCollapsed = (e) => {
      setCollapsed(Boolean(e.detail?.collapsed));
    };
    window.addEventListener('set-sidebar-collapsed', handleSidebarCollapsed);
    return () => window.removeEventListener('set-sidebar-collapsed', handleSidebarCollapsed);
  }, []);

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/profile') return;

    const isComplete = localStorage.getItem('interviewiq_profile_completed') === 'true';
    const isDismissed = sessionStorage.getItem('interviewiq_profile_prompt_dismissed') === 'true';

    if (!isComplete && !isDismissed) {
      const timer = setTimeout(() => {
        setProfileModalOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleDismissProfileModal = () => {
    sessionStorage.setItem('interviewiq_profile_prompt_dismissed', 'true');
    setProfileModalOpen(false);
  };

  const handleGoToProfile = () => {
    sessionStorage.setItem('interviewiq_profile_prompt_dismissed', 'true');
    setProfileModalOpen(false);
    navigate('/profile');
  };

  const handleConfirmLogout = () => {
    sessionStorage.removeItem('interviewiq_profile_prompt_dismissed');
    logoutModalOpen && setLogoutModalOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="h-screen w-screen bg-transparent text-neutral-100 dark:text-neutral-100 flex overflow-hidden font-sans relative">
      {/* Desktop Sidebar (Static 100vh fit, completely non-movable) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      {/* Main Column (Only this area scrolls) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        {/* Header Bar */}
        <header className="h-16 shrink-0 bg-[#0A0A0A]/90 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between z-20 backdrop-blur-xl shadow-md header-backdrop gpu-layer">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-neutral-400 hover:text-white md:hidden rounded-lg hover:bg-white/10 border border-white/10"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* AI Readiness Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/10 text-emerald-400 text-xs font-semibold shadow-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Score: 88.5%
            </div>

            {/* User Profile Quick Card */}
            <Link
              to="/profile"
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-slate-100 transition-colors border border-transparent hover:border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white dark:text-white light:text-slate-900 truncate">
                  {user?.name || 'Aayush Savaliya'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono truncate">
                  {user?.role || 'Candidate'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-transparent dashboard-scroll-container">
          <div className="min-h-full w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 bg-slate-900 dark:bg-slate-950 light:bg-white border-r border-slate-800 p-6 flex flex-col justify-between z-10 text-slate-100"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <Logo to="/dashboard" size="md" />
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {[...SIDEBAR_PRIMARY, ...SIDEBAR_SECONDARY].map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* One-Time Profile Prompt Modal */}
      <AnimatePresence>
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissProfileModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-[#0A0A0A] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Complete Candidate Profile</h3>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                    Recommended Setup
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-[#141414] p-4 rounded-2xl border border-white/10">
                Complete your candidate profile so InterviewIQ can tailor questions, difficulty levels, and evaluations to your skills and target role.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono">
                <button
                  type="button"
                  onClick={handleDismissProfileModal}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
                >
                  Skip for Later
                </button>
                <button
                  type="button"
                  onClick={handleGoToProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  Complete Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
