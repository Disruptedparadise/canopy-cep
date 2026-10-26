import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg font-medium',
      md: 'px-4 py-2 text-xs sm:text-sm font-medium gap-2 rounded-xl',
      lg: 'px-5 py-2.5 text-sm sm:text-base font-medium gap-2.5 rounded-xl',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_22px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0',
      secondary:
        'bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 hover:text-white border border-white/[0.1] shadow-xs hover:-translate-y-0.5 active:translate-y-0',
      outline:
        'bg-transparent hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 hover:-translate-y-0.5 active:translate-y-0',
      ghost:
        'bg-transparent hover:bg-white/[0.08] text-gray-300 hover:text-white border-transparent',
      danger:
        'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-xs hover:-translate-y-0.5 active:translate-y-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B08] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
          fullWidth ? 'w-full' : ''
        } ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
