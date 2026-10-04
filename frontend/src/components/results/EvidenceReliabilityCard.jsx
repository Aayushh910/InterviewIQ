import React from 'react';
import { ShieldCheck, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const EvidenceReliabilityCard = ({ coverage, reliability }) => {
  if (!coverage || !reliability) return null;

  return (
    <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Evidence Coverage & Sensor Reliability</h2>
          <p className="text-xs text-neutral-400">Audit trail of telemetry signals analyzed during evaluation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 font-mono text-xs">
        {/* Answer Quality Coverage */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-1">
          <span className="text-[10px] text-neutral-400 block uppercase">Answer Evidence</span>
          <div className="text-base font-bold text-white">
            {coverage.answered_questions} / {coverage.total_questions} Questions ({coverage.completion_percentage}%)
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold block">
            Reliability: {reliability.answer_coverage}
          </span>
        </div>

        {/* Communication Telemetry Quality */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-1">
          <span className="text-[10px] text-neutral-400 block uppercase">Speech Telemetry</span>
          <div className="text-base font-bold text-white">
            {coverage.has_communication_evidence ? 'Telemetry Available' : 'Not Recorded'}
          </div>
          <span className={`text-[11px] font-semibold block ${coverage.has_communication_evidence ? 'text-cyan-400' : 'text-neutral-400'}`}>
            Sensor Rating: {reliability.communication_quality}
          </span>
        </div>

        {/* Visual Telemetry Quality */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-1">
          <span className="text-[10px] text-neutral-400 block uppercase">Video Telemetry</span>
          <div className="text-base font-bold text-white">
            {coverage.has_visual_evidence ? 'Telemetry Available' : 'Not Recorded'}
          </div>
          <span className={`text-[11px] font-semibold block ${coverage.has_visual_evidence ? 'text-violet-400' : 'text-neutral-400'}`}>
            Sensor Rating: {reliability.visual_quality}
          </span>
        </div>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed font-sans pt-1">
        {coverage.explanation}
      </p>
    </div>
  );
};
