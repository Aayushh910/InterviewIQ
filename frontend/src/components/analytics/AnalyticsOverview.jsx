import React from 'react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { Zap, Award, Activity, MessageSquare } from 'lucide-react';

const radarData = [
  { metric: 'Grammar', score: 94 },
  { metric: 'Vocabulary', score: 88 },
  { metric: 'Communication', score: 90 },
  { metric: 'Confidence', score: 92 },
  { metric: 'Eye Contact', score: 95 },
  { metric: 'Technical Depth', score: 92 },
];

const scoreHistory = [
  { day: 'Mon', score: 78 },
  { day: 'Tue', score: 82 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 89 },
  { day: 'Fri', score: 91 },
  { day: 'Sat', score: 92 },
  { day: 'Sun', score: 94 },
];

export const AnalyticsOverview = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 6-Dimension Skill Radar */}
      <div className="lg:col-span-2 rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                Multidimensional Competency Radar
              </h2>
              <p className="text-xs text-neutral-400">6-axis evaluation of grammar, vocabulary, technical depth & eye contact</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 shadow-sm">
            Overall AI Index: 91.8/100
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="metric" stroke="#a3a3a3" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" fontSize={10} />
              <Radar name="Performance" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Score Progression */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              7-Day Growth Rate & Mastery Curve
            </h2>
          </div>
          <p className="text-xs text-neutral-400">Consistent upward score trajectory across daily mock loops</p>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#a3a3a3" fontSize={11} />
              <YAxis stroke="#a3a3a3" fontSize={11} domain={[60, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
              <Bar dataKey="score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-mono font-semibold text-center">
          +16 Points Score Increase Over 7 Days
        </div>
      </div>
    </div>
  );
};
