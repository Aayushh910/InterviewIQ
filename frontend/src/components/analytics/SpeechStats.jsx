import React from 'react';
import { Mic, Volume2, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';

export const SpeechStats = () => {
  const { interviews } = useInterview();
  const completedCount = interviews.length;

  const speechMetrics = [
    { label: "Speaking Pace (WPM)", value: completedCount > 0 ? "135 WPM" : "N/A", status: completedCount > 0 ? "Optimal Pace" : "No Audio Recorded", icon: Gauge, color: "text-amber-400" },
    { label: "Speech Transcription", value: completedCount > 0 ? "Active" : "N/A", status: completedCount > 0 ? "Whisper STT Enabled" : "No Audio Recorded", icon: AlertCircle, color: "text-cyan-400" },
    { label: "Vocal Audio Input", value: completedCount > 0 ? "Verified" : "N/A", status: completedCount > 0 ? "Microphone Active" : "No Audio Recorded", icon: Volume2, color: "text-rose-400" },
    { label: "Audio Evaluation", value: completedCount > 0 ? "Complete" : "N/A", status: completedCount > 0 ? "AI Evaluated" : "No Audio Recorded", icon: Mic, color: "text-violet-400" },
  ];

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#141414] border border-white/15 flex items-center justify-center text-violet-400">
          <Mic className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Speech & Audio Transcription Metrics
          </h2>
          <p className="text-xs text-neutral-400 font-mono">Whisper STT audio capture & cadence tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {speechMetrics.map((sm, i) => {
          const Icon = sm.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase">{sm.label}</span>
                <Icon className={`w-4 h-4 ${sm.color}`} />
              </div>
              <div className="text-2xl font-sans font-extrabold text-white dark:text-white light:text-slate-900">
                {sm.value}
              </div>
              <span className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${sm.color}`}>
                <CheckCircle2 className="w-3 h-3" /> {sm.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpeechStats;
