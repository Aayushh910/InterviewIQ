import { Logo } from '../common/Logo';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Video, FileText, BarChart3, Award, History,
  User, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export const SIDEBAR_PRIMARY = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "New Interview", path: "/interview", icon: Video },
  { name: "Resume", path: "/resume", icon: FileText },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Achievements", path: "/achievements", icon: Award },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "History", path: "/history", icon: History },
];

export const SIDEBAR_SECONDARY = [
  { name: "Profile", path: "/profile", icon: User },
  { name: "Settings", path: "/settings", icon: Settings },
];

export const Sidebar = ({ collapsed, setCollapsed, onLogoutClick }) => {
  const location = useLocation();

  return (
    <aside
      className={`hidden md:flex flex-col justify-between h-full shrink-0 select-none overflow-hidden bg-[#0A0A0A] border-r border-white/10 p-4 transition-all duration-300 z-30 shadow-2xl backdrop-blur-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Logo & Toggle Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <Logo showText={!collapsed} size="md" to="/dashboard" />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:block border border-white/10"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1.5">
          {SIDEBAR_PRIMARY.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#141414] text-white border border-white/15 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-[#141414]/60 border border-transparent'
                }`}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Secondary & Logout */}
      <div className="pt-4 border-t border-white/10 space-y-1.5">
        {SIDEBAR_SECONDARY.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#141414] text-white border border-white/15 font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]/60 border border-transparent'
              }`}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        <button
          onClick={onLogoutClick}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
