import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden cursor-pointer';

  const variants = {
    primary: 'bg-white text-black font-semibold hover:bg-neutral-200 transition-colors',
    glow: 'bg-white text-black font-semibold hover:bg-neutral-200 transition-colors',
    secondary: 'bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors',
    outline: 'border border-neutral-800 text-white hover:bg-neutral-900 transition-colors',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-colors',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-sm font-semibold gap-2',
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant] || variants.primary, sizes[size], className)}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </motion.button>
  );
};
