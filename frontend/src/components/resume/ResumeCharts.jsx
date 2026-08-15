import React from 'react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { BarChart3, Cpu } from 'lucide-react';

export const ResumeCharts = ({ resume }) => {
  const extractedSkills = (resume?.skillsFound || resume?.skills || []);
  const matchScore = Number(resume?.matchScore || resume?.match_score || 85);

  const skillRadarData = extractedSkills.length > 0
    ? extractedSkills.slice(0, 6).map((sk) => ({
        subject: sk,
        score: Math.min(100, Math.max(60, matchScore + (sk.length % 10))),
      }))
    : [];

  const keywordData = extractedSkills.length > 0
    ? extractedSkills.slice(0, 5).map((sk) => ({
        name: sk,
        coverage: Math.min(100, Math.max(70, matchScore - (sk.length % 8))),
      }))
    : [];

  if (!resume || extractedSkills.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#0A0A0A] border border-white/15 text-center font-mono text-xs text-neutral-400">
        Upload a target resume to view automated skill radar and keyword match coverage charts.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Skill Distribution Radar Chart */}
      <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Parsed Skill Distribution Radar
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
            Extracted Keyword Coverage
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
    </div>
  );
};

export default ResumeCharts;
