import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 group/input">
        <div className="flex flex-col gap-1">
          {label && (
            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-text-dim group-focus-within/input:text-primary transition-colors">
              {label}
              {props.required && <span className="text-status-error ml-1">*</span>}
            </label>
          )}
          {description && (
            <p className="text-[11px] font-medium text-text-muted/60 leading-tight mb-1">
              {description}
            </p>
          )}
        </div>

        <div className="relative isolate">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within/input:text-primary transition-colors z-20">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            className={cn(
              "w-full rounded-2xl bg-white/[0.02] border border-white/10",
              "px-4 py-3.5 text-sm text-text-primary placeholder-text-dim/30",
              "outline-none transition-all duration-300 backdrop-blur-md",
              "hover:bg-white/[0.04] hover:border-white/20",
              "focus:bg-white/[0.05] focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
              icon ? 'pl-12' : '',
              error 
                ? 'border-status-error/50 focus:border-status-error/60 focus:ring-status-error/10 bg-status-error/[0.02]' 
                : '',
              className
            )}
            {...props}
          />
          
          {/* Subtle inner glow on focus */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] font-bold text-status-error uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="w-1 h-1 rounded-full bg-status-error" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = 'Input';
