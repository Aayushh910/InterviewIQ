import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full bg-surfaceDark/60 dark:bg-surfaceDark/80 text-gray-100 dark:text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-borderDark dark:border-white/10 focus:outline-none focus:border-tealAccent focus:ring-1 focus:ring-tealAccent/50 transition-all duration-200',
            Icon && 'pl-10',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-xs text-red-400 font-medium mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-400 mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
