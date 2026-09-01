/**
 * Tactical Industrial Button Component
 * Generous internal breathing room, large unified heights & high-contrast typography
 */

import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'amber'
  | 'bone'
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'magenta';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  icon?: React.ReactNode;
  onReset?: () => void;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  active = false,
  icon,
  onReset,
  children,
  className = '',
  disabled = false,
  onDoubleClick,
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
      case 'bone':
        return active || variant === 'primary' || variant === 'bone'
          ? 'bg-[#f4f4f5] text-black border-white hover:bg-white font-bold shadow-md'
          : 'bg-[#181920] text-slate-100 border-white/25 hover:bg-[#282a36] hover:text-white hover:border-white/40';

      case 'amber':
      case 'cyan':
      case 'blue':
        return active || variant === 'amber'
          ? 'bg-[#f59e0b] text-black font-bold border-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-[#fbbf24]'
          : 'bg-[#181920] text-amber-300 border-amber-500/40 hover:bg-[#282a36] hover:text-amber-200';

      case 'danger':
      case 'magenta':
        return active
          ? 'bg-[#dc2626] text-white font-bold border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
          : 'bg-[#181920] text-red-400 border-red-500/40 hover:bg-red-950/50 hover:text-red-200';

      case 'emerald':
        return active
          ? 'bg-[#10b981] text-black font-bold border-emerald-300'
          : 'bg-[#181920] text-emerald-400 border-emerald-500/40 hover:bg-[#282a36]';

      case 'purple':
        return active
          ? 'bg-[#f4f4f5] text-black border-white font-bold'
          : 'bg-[#181920] text-slate-100 border-white/25 hover:bg-[#282a36]';

      case 'ghost':
        return active
          ? 'bg-white/25 text-white border-white/40'
          : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/15 border-transparent';

      case 'secondary':
      default:
        return active
          ? 'bg-[#f4f4f5] text-black border-white font-bold shadow-md'
          : 'bg-[#14161f] text-slate-100 border-white/20 hover:bg-[#242733] hover:text-white hover:border-white/40';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'h-[40px] px-5 text-xs font-mono font-bold gap-2.5 tracking-[0.12em]';
      case 'lg':
        return 'h-[54px] px-10 text-base font-mono font-bold gap-4 tracking-[0.16em]';
      case 'icon':
        return 'w-[48px] h-[48px] p-0 flex items-center justify-center text-base';
      case 'md':
      default:
        return 'h-[48px] px-7 text-xs md:text-sm font-mono font-bold gap-3 tracking-[0.14em]';
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onReset) onReset();
    if (onDoubleClick) onDoubleClick(e);
  };

  return (
    <button
      disabled={disabled}
      onDoubleClick={handleDoubleClick}
      className={`
        inline-flex items-center justify-center transition-all duration-75
        border rounded-none select-none cursor-pointer outline-none uppercase box-border
        active:translate-y-px active:shadow-inner disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0 mr-1">{icon}</span>}
      {children && <span className="truncate px-1">{children}</span>}
    </button>
  );
};
