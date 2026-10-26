import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'outlined' | 'muted';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const variantClasses = {
      default:
        'bg-[#0C150E]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-emerald-500/25',
      raised:
        'bg-[#101C13]/85 backdrop-blur-md border border-white/[0.1] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] hover:border-emerald-500/30',
      outlined:
        'bg-transparent border border-white/[0.08] hover:border-white/[0.15]',
      muted:
        'bg-[#080E0A]/90 border border-white/[0.05]',
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl overflow-hidden transition-all duration-300 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 border-b border-white/[0.06] ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 bg-white/[0.02] border-t border-white/[0.06] ${className}`}
    {...props}
  >
    {children}
  </div>
);
