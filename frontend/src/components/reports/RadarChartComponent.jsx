import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GlassCard } from '../common/GlassCard';

export const RadarChartComponent = ({ data }) => {
  return (
    <GlassCard className="p-6 border-white/10">
      <h3 className="text-sm font-mono text-gray-400 uppercase mb-4">Competency Breakdown Radar</h3>
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
            <Radar name="Candidate Score" dataKey="score" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
