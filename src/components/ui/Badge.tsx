import React from 'react';

export type BadgeVariant =
  | 'healthy'
  | 'success'
  | 'needs-watch'
  | 'not-surviving'
  | 'default'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    healthy: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      dotColor: 'bg-emerald-400',
    },
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
      dotColor: 'bg-emerald-400',
    },
    'needs-watch': {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      dotColor: 'bg-amber-400',
    },
    'not-surviving': {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/25',
      dotColor: 'bg-red-400',
    },
    default: {
      bg: 'bg-white/[0.05]',
      text: 'text-gray-300',
      border: 'border-white/[0.08]',
      dotColor: 'bg-emerald-400',
    },
    info: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/25',
      dotColor: 'bg-sky-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
      dotColor: 'bg-amber-400',
    },
    danger: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/25',
      dotColor: 'bg-red-400',
    },
    neutral: {
      bg: 'bg-white/[0.04]',
      text: 'text-gray-400',
      border: 'border-white/[0.06]',
      dotColor: 'bg-gray-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none ${style.bg} ${style.text} ${style.border} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor}`} />}
      {children}
    </span>
  );
};
