import React from 'react';
import { Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';

export const ScoreCard = ({ overallScore = 91.5 }) => {
  return (
    <GlassCard className="p-6 border-tealAccent/30 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="emerald" size="md">
            <ShieldCheck className="w-4 h-4" /> FAANG Benchmark Passed
          </Badge>
          <span className="text-xs font-mono text-gray-400">Percentile: Top 3%</span>
        </div>

        <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Overall Composite Score</span>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="text-5xl font-display font-extrabold text-tealAccent">{overallScore}</span>
          <span className="text-xl text-gray-400 font-display">/ 100</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 space-y-2 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emeraldAccent" />
          <span>High Technical Precision in System Trade-offs</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emeraldAccent" />
          <span>Steady Composure under Stress Probing</span>
        </div>
      </div>
    </GlassCard>
  );
};
