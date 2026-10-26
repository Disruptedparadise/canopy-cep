import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wider text-gray-300"
          >
            {label} {required && <span className="text-red-400">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            required={required}
            className={`w-full bg-white/[0.04] hover:bg-white/[0.06] text-white border text-sm px-3.5 py-2.5 rounded-xl transition-all focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 placeholder:text-gray-500 ${
              hasError
                ? 'border-red-500/50 focus:border-red-500 bg-red-500/5'
                : 'border-white/[0.1] focus:border-emerald-500/50'
            } ${leftIcon ? 'pl-10' : ''} ${rightIcon || hasError ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {hasError ? (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {hasError ? (
          <p id={errorId} className="text-xs text-red-400 font-medium flex items-center gap-1 mt-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-gray-400 mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
