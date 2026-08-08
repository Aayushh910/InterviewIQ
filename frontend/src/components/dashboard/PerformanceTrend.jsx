import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const mockTrendData = [
  { session: 'Session 1', score: 72, confidence: 68, grammar: 78, communication: 70 },
  { session: 'Session 2', score: 78, confidence: 75, grammar: 82, communication: 76 },
  { session: 'Session 3', score: 82, confidence: 80, grammar: 85, communication: 81 },
  { session: 'Session 4', score: 85, confidence: 84, grammar: 88, communication: 86 },
  { session: 'Session 5', score: 92, confidence: 90, grammar: 94, communication: 91 },
];

export const PerformanceTrend = () => {
  return (
    <section className="surface-container p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-cyan-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Score Progression & Improvement Trend
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Historical AI mastery curve across your recent mock sessions</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
          <TrendingUp className="w-4 h-4" /> +20% Improvement Rate
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
            <XAxis dataKey="session" stroke="#a3a3a3" fontSize={12} tickLine={false} />
            <YAxis stroke="#a3a3a3" fontSize={12} domain={[50, 100]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0A0A0A',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#a3a3a3' }} />
            <Line type="monotone" dataKey="score" name="Overall Score" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="confidence" name="Confidence" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="grammar" name="Grammar" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="communication" name="Communication" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
