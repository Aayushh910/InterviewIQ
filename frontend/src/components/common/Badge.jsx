import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  variant = 'monochrome',
  size = 'md',
  className = '',
}) => {
  const baseVariants = 'bg-neutral-900/90 text-neutral-300 border-neutral-800';

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1 text-xs font-medium tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        baseVariants,
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
