import React from 'react';
import {motion, type HTMLMotionProps} from 'motion/react';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'cobalt' | 'obsidian' | 'glass' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const BTN_VARIANTS = {
  cobalt: 'glass-btn-cobalt text-white',
  obsidian: 'glass-btn-obsidian text-white',
  glass: 'glass-btn-light text-slate-900',
  emerald: 'glass-btn-emerald text-white',
};

const BTN_SIZES = {
  sm: 'h-9 px-3.5 rounded-[12px] text-xs',
  md: 'h-11 px-5 rounded-[14px] text-sm',
  lg: 'h-12 px-7 rounded-[16px] text-sm sm:text-base',
};

export function GlassButton({
  variant = 'glass',
  size = 'md',
  className = '',
  children,
  ...props
}: GlassButtonProps) {
  return (
    <motion.button
      whileHover={{y: -1}}
      whileTap={{scale: 0.97}}
      transition={{duration: 0.16, ease: [0.16, 1, 0.3, 1]}}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-colors ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
