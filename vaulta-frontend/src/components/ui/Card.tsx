import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
}: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={
        hover
          ? { 
              y: -4, 
              transition: { type: "spring", stiffness: 400, damping: 25 } 
            }
          : undefined
      }
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-6",
        hover && "glass-card-hover cursor-pointer",
        glow && "animate-slow-glow border-primary/20",
        className
      )}
    >
      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-glass-gradient pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

