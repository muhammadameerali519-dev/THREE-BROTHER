import React, {useState} from 'react';
import {
  AudioLines,
  Camera,
  Cpu,
  Gamepad2,
  Headphones,
  Home,
  Keyboard,
  Laptop,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Speaker,
  Watch,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface SquircleIconProps {
  icon: LucideIcon;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'glass' | 'dark' | 'cobalt' | 'subtle' | 'outline' | 'emerald';
  className?: string;
  iconClassName?: string;
  strokeWidth?: number;
}

const SIZE_MAP = {
  xxs: 'w-5 h-5 rounded-[7px]',
  xs: 'w-7 h-7 rounded-[9px]',
  sm: 'w-9 h-9 rounded-[12px]',
  md: 'w-11 h-11 rounded-[14px]',
  lg: 'w-12 h-12 rounded-[16px]',
  xl: 'w-14 h-14 rounded-[19px]',
};

const ICON_SIZE_MAP = {
  xxs: 'w-3 h-3',
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const VARIANT_MAP = {
  glass:
    'bg-gradient-to-br from-white/85 via-white/60 to-white/40 backdrop-blur-md border border-white/80 text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)]',
  dark:
    'bg-gradient-to-br from-slate-800/90 to-slate-950/95 backdrop-blur-md border border-white/20 text-white shadow-[0_6px_18px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]',
  cobalt:
    'bg-gradient-to-br from-blue-500/95 to-blue-700/95 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_20px_rgba(37,99,235,0.38),inset_0_1px_0_rgba(255,255,255,0.45)]',
  emerald:
    'bg-gradient-to-br from-emerald-500/95 to-emerald-700/95 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_20px_rgba(22,163,74,0.35),inset_0_1px_0_rgba(255,255,255,0.45)]',
  subtle:
    'bg-gradient-to-br from-white/65 to-slate-200/45 backdrop-blur-md border border-white/75 text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]',
  outline:
    'bg-white/30 backdrop-blur-md border border-white/65 text-slate-800 hover:bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
};

export function SquircleIcon({
  icon: Icon,
  size = 'md',
  variant = 'glass',
  className = '',
  iconClassName = '',
  strokeWidth = 1.9,
}: SquircleIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.04] ${SIZE_MAP[size]} ${VARIANT_MAP[variant]} ${className}`}
    >
      <Icon className={`${ICON_SIZE_MAP[size]} ${iconClassName}`} strokeWidth={strokeWidth} />
    </span>
  );
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Cpu,
  Watch,
  Headphones,
  AudioLines,
  Speaker,
  Gamepad2,
  Camera,
  Monitor,
  Wind,
  ShieldCheck,
  Keyboard,
  Home,
  Sparkles,
  Zap,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICON_MAP[iconName] || Cpu;
}

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export function SmartImage({src, alt, className = '', fallbackTitle, priority = false}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-white/70 via-slate-100/80 to-slate-200/70 backdrop-blur-md text-slate-500 p-4 text-center ${className}`}
      >
        <SquircleIcon icon={Cpu} size="lg" variant="glass" />
        {fallbackTitle && <span className="mt-2 text-xs font-medium text-slate-600 line-clamp-1">{fallbackTitle}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
