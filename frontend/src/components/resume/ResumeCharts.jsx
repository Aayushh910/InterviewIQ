import React from 'react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Cpu } from 'lucide-react';

const skillRadarData = [
  { subject: 'Frontend React', score: 94 },
  { subject: 'TypeScript', score: 90 },
  { subject: 'System Design', score: 85 },
  { subject: 'Node/Express', score: 88 },
  { subject: 'Testing RTL', score: 78 },
  { subject: 'Cloud & CI/CD', score: 82 },
];

const keywordData = [
  { name: 'Core React', coverage: 98 },
  { name: 'State Mgmt', coverage: 92 },
  { name: 'API Design', coverage: 88 },
  { name: 'Performance', coverage: 85 },
  { name: 'Security', coverage: 76 },
];

const experienceData = [
  { name: 'Senior Roles', value: 45, color: '#10b981' },
  { name: 'Mid-Level', value: 35, color: '#06b6d4' },
  { name: 'Architecture', value: 20, color: '#a855f7' },
];

export const ResumeCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Skill Distribution Radar Chart */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Skill Distribution Radar
          </h3>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={skillRadarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#a3a3a3" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" fontSize={10} />
              <Radar name="Skills" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Keyword Coverage Bar Chart */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Keyword Match Coverage
          </h3>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#a3a3a3" fontSize={10} />
              <YAxis stroke="#a3a3a3" fontSize={10} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="coverage" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Experience Breakdown Pie Chart */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Experience Breakdown
          </h3>
        </div>
        <div className="h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={experienceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
                paddingAngle={4}
              >
                {experienceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
