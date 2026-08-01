import React from 'react';
import { cn } from '../../utils/cn';

export const SkeletonLoader = ({
  className = '',
  variant = 'rectangular', // 'text', 'circular', 'rectangular'
  width,
  height,
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      style={{ width, height }}
      className={cn(
        'animate-pulse bg-surfaceDark/60 dark:bg-white/5 border border-borderDark/50 dark:border-white/5',
        variantStyles[variant],
        className
      )}
    />
  );
};
