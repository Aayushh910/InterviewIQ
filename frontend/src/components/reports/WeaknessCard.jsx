import React from 'react';
import { AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';

export const WeaknessCard = ({ title, issue, recommendation }) => {
  return (
    <GlassCard className="p-5 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h4 className="font-display font-bold text-gray-100 text-sm">{title}</h4>
      </div>
      <p className="text-xs text-gray-300 mb-3 leading-relaxed">{issue}</p>
      <div className="pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-tealAccent">
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
        <span><strong>Actionable Fix:</strong> {recommendation}</span>
      </div>
    </GlassCard>
  );
};
