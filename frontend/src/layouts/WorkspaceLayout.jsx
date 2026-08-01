import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Search, Bell, Sun, Moon, Sparkles, User, LogOut, ChevronRight
} from 'lucide-react';
import { Sidebar, SIDEBAR_PRIMARY, SIDEBAR_SECONDARY } from '../components/layout/Sidebar';
import { LogoutModal } from '../components/common/LogoutModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME } from '../utils/constants';

export const WorkspaceLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
        <header className="h-16 shrink-0 bg-[#0A0A0A]/90 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between z-20 backdrop-blur-xl shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-neutral-400 hover:text-white md:hidden rounded-lg hover:bg-white/10 border border-white/10"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Quick Search Input */}
            <div className="relative hidden sm:flex items-center w-64 lg:w-80">
              <Search className="w-4 h-4 absolute left-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search interviews, reports, skills..."
                className="w-full bg-[#141414] border border-white/10 text-xs rounded-xl pl-9 pr-4 py-2 text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* AI Readiness Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/10 text-emerald-400 text-xs font-semibold shadow-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Score: 88.5%
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#141414] transition-colors border border-white/10"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
            </button>

            {/* User Profile Quick Card */}
            <Link
              to="/profile"
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-slate-100 transition-colors border border-transparent hover:border-white/10"
            >
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20 shrink-0"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white dark:text-white light:text-slate-900 truncate">
                  {user?.name || 'Alex Rivera'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono truncate">
                  {user?.role || 'Full-Stack Candidate'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children || <Outlet />}
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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-display font-bold text-lg text-slate-100">{APP_NAME}</span>
                  </div>
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
