import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { Loader2 } from 'lucide-react';

// Layouts (eagerly loaded)
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';

// Fast Loading Fallback Component
const RouteLoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-10 h-10 rounded-2xl bg-[#141414] border border-white/20 flex items-center justify-center text-cyan-400 shadow-xl">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
    <span className="text-xs font-mono text-neutral-400">Loading workspace...</span>
  </div>
);

// Code-split / Lazy Load Pages for fast initial application startup
const Landing = lazy(() => import('../pages/Landing/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('../pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Interview = lazy(() => import('../pages/Interview/Interview').then(m => ({ default: m.Interview })));
const Analytics = lazy(() => import('../pages/Analytics/Analytics').then(m => ({ default: m.Analytics })));
const History = lazy(() => import('../pages/History/History').then(m => ({ default: m.History })));
const Profile = lazy(() => import('../pages/Profile/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('../pages/Settings/Settings').then(m => ({ default: m.Settings })));

// Helper to redirect legacy report/results URLs into /history while retaining session ID
const LegacyReportRedirect = () => {
  const location = useLocation();
  const search = location.search;
  return <Navigate to={`/history${search}`} replace />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Preserved Public Landing Page */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        {/* Preserved Public Auth Pages */}
        <Route
          element={
            <PublicOnlyRoute>
              <AuthLayout />
            </PublicOnlyRoute>
          }
        >
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Master Workspace Pages (Single unified History page, no Resume page, no separate Reports page) */}
        <Route
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Retired Resume Routes Redirects */}
          <Route path="/resume" element={<Navigate to="/dashboard" replace />} />
          <Route path="/resume-studio" element={<Navigate to="/dashboard" replace />} />

          {/* Retired Reports/Results Pages Redirected to Unified History */}
          <Route path="/reports" element={<LegacyReportRedirect />} />
          <Route path="/reports/:sessionId" element={<LegacyReportRedirect />} />
          <Route path="/results/:sessionId" element={<LegacyReportRedirect />} />
          <Route path="/results" element={<LegacyReportRedirect />} />

          {/* Legacy Route Aliases & Fallback Redirects */}
          <Route path="/interviews" element={<Navigate to="/interview" replace />} />
          <Route path="/interviews/create" element={<Navigate to="/interview" replace />} />
          <Route path="/interviews/history" element={<Navigate to="/history" replace />} />
          <Route path="/coach" element={<Navigate to="/analytics" replace />} />
          <Route path="/ai-coach" element={<Navigate to="/analytics" replace />} />
          <Route path="/achievements" element={<Navigate to="/dashboard" replace />} />
          <Route path="/learning" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
