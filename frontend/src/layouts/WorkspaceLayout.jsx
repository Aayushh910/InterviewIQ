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

  const handleConfirmLogout = () => {
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
    </div>
  );
};
