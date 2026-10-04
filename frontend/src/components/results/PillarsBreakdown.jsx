import React from 'react';
import { BookOpen, Mic, Video, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const PillarsBreakdown = ({ answerQuality, communication, visualPresentation }) => {
  return (
    <div className="space-y-4">
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Evaluation Pillars Breakdown
        </h2>
        <span className="text-xs text-neutral-400 font-mono">3 Core Pillars</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Answer Quality */}
        <div className="p-6 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Answer Quality</h3>
                  <span className="text-[11px] text-neutral-400 font-mono">Weight: {answerQuality.applied_weight_pct}%</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xl font-extrabold text-emerald-400">{Math.round(answerQuality.score)}%</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {answerQuality.explanation}
            </p>

            {/* 5 Core Dimensions */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                5 Core Dimensions
              </div>
              <div className="space-y-2">
                {(answerQuality.dimensions || []).map((dim) => (
                  <div key={dim.dimension_key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-300">{dim.dimension_name}</span>
                      <span className="text-emerald-400 font-semibold">{Math.round(dim.score)}%</span>
                    </div>
                    <div className="w-full bg-[#141414] border border-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Communication Behavior */}
        <div className="p-6 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Observable Communication</h3>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {communication.is_available ? `Weight: ${communication.applied_weight_pct}%` : 'Weight Renormalized'}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                {communication.is_available && communication.score !== null ? (
                  <span className="text-2xl font-extrabold text-cyan-400">{Math.round(communication.score)}%</span>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Not Captured</span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {communication.explanation}
            </p>

            {/* Observable Telemetry Signals */}
            {communication.is_available ? (
              <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Speech Telemetry Signals
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                    <span className="text-[10px] text-neutral-400 block">Speaking Rate</span>
                    <span className="font-bold text-white">{communication.signals.speaking_rate_wpm || 0} WPM</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                    <span className="text-[10px] text-neutral-400 block">Filler Words</span>
                    <span className="font-bold text-white">{communication.signals.filler_word_count ?? 0}</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                  <span className="text-[10px] text-neutral-400 block">Conversational Cadence</span>
                  <span className="font-semibold text-cyan-400 text-[11px]">{communication.signals.speaking_flow || 'Steady'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#141414]/70 border border-white/10 text-xs text-neutral-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Audio telemetry was not recorded. In accordance with InterviewIQ scoring rules, weight was dynamically redistributed to answer quality without penalty.</span>
              </div>
            )}
          </div>
        </div>

        {/* Pillar 3: Visual Presentation */}
        <div className="p-6 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Visual Presentation</h3>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {visualPresentation.is_available ? `Weight: ${visualPresentation.applied_weight_pct}%` : 'Weight Renormalized'}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                {visualPresentation.is_available && visualPresentation.score !== null ? (
                  <span className="text-2xl font-extrabold text-violet-400">{Math.round(visualPresentation.score)}%</span>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Not Captured</span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {visualPresentation.explanation}
            </p>

            {/* Observable Visual Signals */}
            {visualPresentation.is_available ? (
              <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Visual Framing Signals
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                    <span className="text-[10px] text-neutral-400 block">Face Presence</span>
                    <span className="font-bold text-white">{visualPresentation.signals.face_presence_pct || 0}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                    <span className="text-[10px] text-neutral-400 block">Camera Alignment</span>
                    <span className="font-bold text-white">{visualPresentation.signals.camera_alignment_pct || 0}%</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#141414] border border-white/10">
                  <span className="text-[10px] text-neutral-400 block">Framing Stability</span>
                  <span className="font-semibold text-violet-400 text-[11px]">{visualPresentation.signals.position_quality_pct || 90}% Optimal</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#141414]/70 border border-white/10 text-xs text-neutral-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>Video telemetry was not recorded. In accordance with InterviewIQ scoring rules, weight was dynamically redistributed to answer quality without penalty.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
