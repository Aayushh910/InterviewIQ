import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';
import { TrendingUp, Target, Award } from 'lucide-react';

export const ProgressCard = () => {
  const skills = [
    { name: "Technical Knowledge", score: "92%" },
    { name: "STAR Method Structure", score: "86%" },
    { name: "Communication & Tone", score: "89%" },
    { name: "Eye Contact & Posture", score: "90%" }
  ];

  return (
    <GlassCard className="p-6 border-tealAccent/30 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="teal" size="sm">
            <TrendingUp className="w-3 h-3" /> Readiness Score
          </Badge>
          <span className="text-xs font-mono text-gray-400">Target: High Alignment</span>
        </div>

        <h3 className="text-xl font-display font-bold text-gray-100 mb-2">Interview Mastery Index</h3>
        
        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Overall Readiness Index</span>
            <span className="text-tealAccent font-mono font-bold">88.5 / 100</span>
          </div>
          <div className="w-full bg-surfaceDark rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
            <div
              className="bg-gradient-to-r from-tealAccent via-cyanAccent to-emeraldAccent h-full rounded-full transition-all duration-1000 shadow-glow-teal"
              style={{ width: '88.5%' }}
            />
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="space-y-2 mt-5">
          {skills.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{s.name}</span>
              <span className="text-gray-200 font-mono font-medium">{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyanAccent" />
          <span className="text-xs text-gray-300">18 Practice Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emeraldAccent" />
          <span className="text-xs text-gray-300">InterviewIQ Analyzed</span>
        </div>
      </div>
    </GlassCard>
  );
};
