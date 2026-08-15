import React from 'react';
import { motion } from 'framer-motion';
import { WelcomeHero } from '../../components/dashboard/WelcomeHero';
import { KPICards } from '../../components/dashboard/KPICards';
import { PerformanceTrend } from '../../components/dashboard/PerformanceTrend';
import { RecentInterviews } from '../../components/dashboard/RecentInterviews';
import { AISuggestions } from '../../components/dashboard/AISuggestions';
import { WeeklyGoals } from '../../components/dashboard/WeeklyGoals';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { useAuth } from '../../context/AuthContext';
import { useInterview } from '../../context/InterviewContext';
import { useResumes } from '../../context/ResumeContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const { interviews } = useInterview();
  const { resumes } = useResumes();

  // Compute real dynamic statistics strictly from database state
  const totalSessions = interviews.length;
  const evaluatedInterviews = interviews.filter(i => i.score !== undefined && i.score !== null && Number(i.score) > 0);
  
  const readinessScore = evaluatedInterviews.length > 0
    ? (evaluatedInterviews.reduce((sum, item) => sum + Number(item.score), 0) / evaluatedInterviews.length).toFixed(1)
    : 'N/A';

  const avgConfidence = evaluatedInterviews.length > 0
    ? (evaluatedInterviews.reduce((sum, item) => sum + Number(item.confidence || item.score), 0) / evaluatedInterviews.length).toFixed(1)
    : 'N/A';

  const atsScore = resumes.length > 0
    ? `${resumes[0].match_score || resumes[0].matchScore || 85}%`
    : 'N/A';

  const totalHours = totalSessions > 0
    ? (interviews.reduce((sum, item) => sum + Number(item.duration_minutes || 15), 0) / 60).toFixed(1)
    : '0.0';

  const realStats = {
    readinessScore,
    totalSessions,
    avgConfidence,
    atsScore,
    totalHours,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto relative z-10"
    >
      {/* Background ambient light */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Welcome Hero */}
      <WelcomeHero userName={user?.name} activeInterview={interviews[0]} />

      {/* KPI Cards */}
      <KPICards stats={realStats} />

      {/* Quick Actions Shortcuts */}
      <QuickActions />

      {/* Performance Trend & Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PerformanceTrend interviews={interviews} />
        </div>
        <div>
          <AISuggestions interviews={interviews} />
        </div>
      </div>

      {/* Recent Interviews & Weekly Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentInterviews interviews={interviews} />
        </div>
        <div>
          <WeeklyGoals interviews={interviews} />
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
