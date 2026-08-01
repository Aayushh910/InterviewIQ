import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const Timer = ({ initialMinutes = 45, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceDark border border-white/10 text-xs font-mono text-gray-200">
      <Clock className="w-4 h-4 text-tealAccent" />
      <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
};
