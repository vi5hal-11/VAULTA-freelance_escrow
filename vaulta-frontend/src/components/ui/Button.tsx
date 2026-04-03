import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-main text-white shadow-glow-primary border-none hover:shadow-glow-secondary',
  secondary:
    'bg-background-tertiary text-text-primary border border-white/10 hover:bg-white/5',
  danger:
    'bg-status-error/20 text-status-error border border-status-error/30 hover:bg-status-error/30 hover:shadow-glow-secondary',
  ghost:
    'bg-transparent text-text-muted hover:bg-white/5 hover:text-text-primary border-none',
  outline:
    'bg-transparent border border-white/20 text-text-primary hover:bg-white/5',
  glass:
    'glass-card text-text-primary hover:glass-card-hover border-white/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
  xl: 'px-9 py-4 text-lg font-bold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      className={cn(
        "btn-premium inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-all duration-300 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

