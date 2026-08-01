import React, { useEffect, useRef } from 'react';
import { Badge } from '../common/Badge';

export const Transcript = ({ transcripts = [] }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full bg-surfaceDark/80 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <span className="text-xs font-mono text-gray-400">REAL-TIME SPEECH STREAM</span>
        <span className="text-[10px] font-mono text-tealAccent">Sub-240ms Latency</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {transcripts.map((t, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-bgDark/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${t.speaker === 'AI Interviewer' ? 'text-cyanAccent' : 'text-tealAccent'}`}>
                {t.speaker}
              </span>
              <span className="text-gray-500 font-mono">{t.time}</span>
            </div>
            <p className="text-xs text-gray-300 font-light leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
