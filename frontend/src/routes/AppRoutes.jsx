import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';

// Preserved Public Pages (UNCHANGED)
import { Landing } from '../pages/Landing/Landing';
import { Login } from '../pages/Auth/Login';
import { Register } from '../pages/Auth/Register';
import { ForgotPassword } from '../pages/Auth/ForgotPassword';

// Refactored Master Workspace Pages
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Interview } from '../pages/Interview/Interview';
import { Resume } from '../pages/Resume/Resume';
import { Analytics } from '../pages/Analytics/Analytics';
import { Reports } from '../pages/Reports/Reports';
import { Achievements } from '../pages/Achievements/Achievements';
import { History } from '../pages/History/History';
import { Profile } from '../pages/Profile/Profile';
import { Settings } from '../pages/Settings/Settings';

export const AppRoutes = () => {
  return (
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

      {/* Refactored Finalized Workspace Pages */}
      <Route
        element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Legacy Route Aliases & Fallback Redirects */}
        <Route path="/interviews" element={<Navigate to="/interview" replace />} />
        <Route path="/interviews/create" element={<Navigate to="/interview" replace />} />
        <Route path="/interviews/history" element={<Navigate to="/history" replace />} />
        <Route path="/resume-studio" element={<Navigate to="/resume" replace />} />
        <Route path="/coach" element={<Navigate to="/analytics" replace />} />
        <Route path="/ai-coach" element={<Navigate to="/analytics" replace />} />
        <Route path="/learning" element={<Navigate to="/achievements" replace />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
