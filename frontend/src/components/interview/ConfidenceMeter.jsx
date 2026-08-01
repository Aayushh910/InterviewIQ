import React from 'react';
import { ShieldCheck, Activity, Eye, Mic } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

export const ConfidenceMeter = ({ score = 91, wpm = 142, eyeContact = 94 }) => {
  return (
    <GlassCard className="p-4 border-white/10 flex flex-col justify-between">
      <span className="text-xs font-mono text-gray-400 mb-2">LIVE MULTIMODAL TELEMETRY</span>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-tealAccent" /> Composure Index</span>
            <span className="text-tealAccent font-bold font-mono">{score}%</span>
          </div>
          <div className="w-full bg-bgDark rounded-full h-2 overflow-hidden border border-white/5">
            <div className="bg-tealAccent h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-cyanAccent" /> Eye Contact Ratio</span>
            <span className="text-cyanAccent font-bold font-mono">{eyeContact}%</span>
          </div>
          <div className="w-full bg-bgDark rounded-full h-2 overflow-hidden border border-white/5">
            <div className="bg-cyanAccent h-full rounded-full transition-all duration-500" style={{ width: `${eyeContact}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 flex items-center gap-1"><Mic className="w-3.5 h-3.5 text-violetAccent" /> Vocal Cadence (WPM)</span>
            <span className="text-violetAccent font-bold font-mono">{wpm} WPM</span>
          </div>
          <div className="w-full bg-bgDark rounded-full h-2 overflow-hidden border border-white/5">
            <div className="bg-violetAccent h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (wpm / 180) * 100)}%` }} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
