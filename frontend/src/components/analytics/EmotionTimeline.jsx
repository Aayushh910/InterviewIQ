import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ThumbsUp, AlertCircle } from 'lucide-react';

const emotionTimelineData = [
  { time: '0m', confidence: 85, focus: 90, stress: 15 },
  { time: '5m', confidence: 88, focus: 92, stress: 12 },
  { time: '10m', confidence: 82, focus: 88, stress: 20 },
  { time: '15m', confidence: 91, focus: 95, stress: 10 },
  { time: '20m', confidence: 94, focus: 96, stress: 8 },
  { time: '25m', confidence: 96, focus: 98, stress: 5 },
];

export const EmotionTimeline = () => {
  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Session Emotion & Composure Timeline
          </h2>
        </div>
        <span className="text-xs text-purple-400 font-mono font-semibold bg-[#141414] px-3 py-1 rounded-full border border-white/20 shadow-sm">
          Peak Focus at 25m
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={emotionTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="time" stroke="#a3a3a3" fontSize={11} />
            <YAxis stroke="#a3a3a3" fontSize={11} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
            <Line type="monotone" dataKey="confidence" name="Confidence Level" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="focus" name="Focus Rating" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="stress" name="Stress / Anxiety" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Strengths & Weaknesses Quick Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/15 text-xs text-neutral-300 flex items-start gap-2">
          <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-400 font-bold mb-0.5">Key Strengths:</strong>
            Maintained peak composure during complex System Architecture follow-ups. Strong vocal resonance.
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/15 text-xs text-neutral-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-400 font-bold mb-0.5">Areas for Growth:</strong>
            Slight stress spike at 10m when asked about edge-case concurrency handling. Practice 1-sec breath pauses.
          </div>
        </div>
      </div>
    </div>
  );
};
