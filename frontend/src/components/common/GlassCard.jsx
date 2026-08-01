import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const GlassCard = ({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'teal',
  onClick,
  ...props
}) => {
  const glowStyles = {
    teal: 'hover:shadow-glow-teal hover:border-tealAccent/40',
    cyan: 'hover:shadow-glow-cyan hover:border-cyanAccent/40',
    violet: 'hover:shadow-glow-violet hover:border-violetAccent/40',
    emerald: 'hover:shadow-emeraldAccent/20 hover:border-emeraldAccent/40',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300',
        hoverEffect && glowStyles[glowColor],
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {/* Background ambient light reflection */}
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-tealAccent/10 rounded-full blur-2xl pointer-events-none" />
      {children}
    </motion.div>
  );
};
