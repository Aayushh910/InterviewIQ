import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, BarChart2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PerformanceTrend = ({ interviews = [] }) => {
  const evaluatedInterviews = [...interviews]
    .filter((i) => i.score !== undefined && i.score !== null && Number(i.score) > 0)
    .reverse();

  const trendData = evaluatedInterviews.map((item, idx) => ({
    session: `Session ${idx + 1}`,
    score: Number(item.score),
    role: item.title || item.job_role || 'Practice Loop',
  }));

  const firstScore = trendData.length > 0 ? trendData[0].score : 0;
  const latestScore = trendData.length > 0 ? trendData[trendData.length - 1].score : 0;
  
  const improvementRate = trendData.length >= 2 && firstScore > 0
    ? Math.round(((latestScore - firstScore) / firstScore) * 100)
    : null;

  return (
    <section className="surface-container p-6 sm:p-7 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
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

        {improvementRate !== null && (
          <div className="flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
            <TrendingUp className="w-4 h-4" /> {improvementRate >= 0 ? `+${improvementRate}%` : `${improvementRate}%`} Score Improvement
          </div>
        )}
      </div>

      {trendData.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 text-center space-y-3">
          <Activity className="w-10 h-10 text-neutral-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Interview History Available</h3>
          <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
            Complete your first AI mock interview to track your score trajectory, accuracy progression, and skill improvement over time.
          </p>
          <div className="pt-2">
            <Link
              to="/interview"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold font-mono text-xs hover:bg-neutral-200 transition-colors shadow-md"
            >
              Start Practice Session
            </Link>
          </div>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey="session" stroke="#a3a3a3" fontSize={12} tickLine={false} />
              <YAxis stroke="#a3a3a3" fontSize={12} domain={[0, 100]} tickLine={false} />
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
              <Line type="monotone" dataKey="score" name="Overall AI Score" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default PerformanceTrend;
