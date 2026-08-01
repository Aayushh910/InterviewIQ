import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight, Eye, Mic, BrainCircuit } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const RecentInterview = () => {
  const navigate = useNavigate();

  return (
    <GlassCard className="p-6 border-tealAccent/30 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Badge variant="cyan" size="sm" className="mb-2">Last Completed Session</Badge>
          <h3 className="text-xl font-display font-extrabold text-gray-100">
            Full-Stack Developer & Technical Interview Loop
          </h3>
          <p className="text-xs text-gray-400 mt-1">Completed 2 hours ago • 35 Mins Duration</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/reports?id=last')}>
          Full Performance Report
        </Button>
      </div>

      {/* Metric Highlights Pill Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-surfaceDark/80 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-tealAccent/15 text-tealAccent">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400">Knowledge Depth</span>
            <span className="text-lg font-bold text-tealAccent font-display">94 / 100</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyanAccent/15 text-cyanAccent">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400">Eye Contact Ratio</span>
            <span className="text-lg font-bold text-cyanAccent font-display">92% Optimal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violetAccent/15 text-violetAccent">
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400">Vocal Cadence</span>
            <span className="text-lg font-bold text-violetAccent font-display">138 WPM</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
