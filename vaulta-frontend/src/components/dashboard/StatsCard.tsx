import { type ReactNode, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  color: string;
}

function AnimatedNumber({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    if (target >= 1000) return Math.round(v).toLocaleString();
    if (Number.isInteger(target)) return Math.round(v).toString();
    return v.toFixed(2);
  });

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 1.5,
      ease: [0.34, 1.56, 0.64, 1],
    });
    return controls.stop;
  }, [target, motionVal]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  const [hasAppeared, setHasAppeared] = useState(false);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  const isNumeric = !isNaN(numericValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      onAnimationComplete={() => setHasAppeared(true)}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card glass-card-hover group relative p-6 overflow-hidden"
    >
      {/* Decorative gradient glow */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-[64px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 rounded-full"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
            style={{ 
              backgroundColor: `${color}15`,
              boxShadow: `inset 0 0 10px ${color}10`
            }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-md",
                trend.positive
                  ? 'text-status-success bg-status-success/10'
                  : 'text-status-error bg-status-error/10'
              )}
            >
              {trend.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-1">
            {typeof value === 'string' && value.includes('$') && <span className="text-xl font-medium text-text-dim">$</span>}
            <p className="text-3xl font-black text-text-primary tracking-tight">
              {isNumeric && hasAppeared ? (
                <AnimatedNumber target={numericValue} />
              ) : isNumeric ? (
                '0'
              ) : (
                value
              )}
            </p>
            {typeof value === 'string' && value.toLowerCase().includes('eth') && <span className="text-lg font-bold text-primary ml-1">ETH</span>}
          </div>
        </div>
      </div>

      {/* Progress bar simulation for aesthetic */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.03] overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: '40%' }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-gradient-to-r from-transparent"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
}

