import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'brand' | 'default';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  // Pill-shaped buttons (fully rounded) per DESIGN RULES
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  const variants = {
    // Primary: solid deep green (default #2E7D1E, hover #3A9A26)
    primary:
      'bg-[#2E7D1E] hover:bg-[#3A9A26] active:bg-[#256618] text-white shadow-sm shadow-[#2E7D1E]/20 focus:ring-[#2E7D1E]',
    default:
      'bg-[#2E7D1E] hover:bg-[#3A9A26] active:bg-[#256618] text-white shadow-sm shadow-[#2E7D1E]/20 focus:ring-[#2E7D1E]',
    brand:
      'bg-[#2E7D1E] hover:bg-[#3A9A26] active:bg-[#256618] text-white shadow-sm shadow-[#2E7D1E]/20 focus:ring-[#2E7D1E]',
    // Secondary: outlined ghost pill with visible hover and pressed state
    secondary:
      'border border-white/20 bg-transparent hover:bg-white/10 active:bg-white/15 text-foreground focus:ring-[#2E7D1E]',
    outline:
      'border border-white/20 bg-transparent hover:bg-white/10 active:bg-white/15 text-foreground focus:ring-[#2E7D1E]',
    ghost:
      'bg-transparent hover:bg-white/10 active:bg-white/15 text-foreground focus:ring-[#2E7D1E]',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
  };

  const sizes = {
    sm: 'text-xs min-h-[36px] px-3.5 py-1.5 gap-1.5',
    md: 'text-sm min-h-[44px] px-5 py-2.5 gap-2', // Meets 44px touch target
    lg: 'text-base min-h-[50px] px-7 py-3 gap-2.5 font-semibold',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
