import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { cn } from '../../utils/cn';

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'up',
  color = 'teal',
}) => {
  const iconColors = {
    teal: 'bg-tealAccent/15 text-tealAccent border-tealAccent/30',
    cyan: 'bg-cyanAccent/15 text-cyanAccent border-cyanAccent/30',
    violet: 'bg-violetAccent/15 text-violetAccent border-violetAccent/30',
    emerald: 'bg-emeraldAccent/15 text-emeraldAccent border-emeraldAccent/30',
  };

  return (
    <GlassCard className="p-5 border-white/10 hover:border-tealAccent/30 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        {Icon && (
          <div className={cn('p-2 rounded-xl border', iconColors[color])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-display font-extrabold text-gray-100 dark:text-gray-100">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
            )}
          >
            {change}
          </span>
        )}
      </div>
    </GlassCard>
  );
};
