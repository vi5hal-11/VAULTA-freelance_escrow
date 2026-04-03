import { motion } from 'framer-motion';
import {
  DollarSign,
  Upload,
  CheckCircle,
  Send,
  AlertTriangle,
  Plus,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  address?: string;
}

const typeConfig: Record<string, { icon: typeof DollarSign; color: string; bgColor: string }> = {
  funded: { icon: DollarSign, color: 'hsl(var(--status-success))', bgColor: 'hsla(var(--status-success) / 0.1)' },
  submitted: { icon: Upload, color: 'hsl(var(--accent-primary))', bgColor: 'hsla(var(--accent-primary) / 0.1)' },
  approved: { icon: CheckCircle, color: 'hsl(var(--status-info))', bgColor: 'hsla(var(--status-info) / 0.1)' },
  released: { icon: Send, color: 'hsl(var(--accent-secondary))', bgColor: 'hsla(var(--accent-secondary) / 0.1)' },
  disputed: { icon: AlertTriangle, color: 'hsl(var(--status-error))', bgColor: 'hsla(var(--status-error) / 0.1)' },
  created: { icon: Plus, color: 'hsl(var(--status-warning))', bgColor: 'hsla(var(--status-warning) / 0.1)' },
};

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  },
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="glass-card flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em]">
          Live Activity
        </h3>
        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 mt-4 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-dim opacity-40">
            <Activity className="w-10 h-10 mb-3 stroke-[1px]" />
            <p className="text-sm font-medium">Listening for events...</p>
          </div>
        ) : (
          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {activities.map((item) => {
              const config = typeConfig[item.type] ?? {
                icon: Activity,
                color: 'hsl(var(--text-dim))',
                bgColor: 'hsla(var(--text-dim) / 0.1)',
              };
              const Icon = config.icon;

              return (
                <motion.li
                  key={item.id}
                  variants={itemVariants}
                  className="group relative flex items-start gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 ring-1 ring-transparent hover:ring-white/5"
                >
                  {/* Icon with glow */}
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                    <div 
                      className="absolute inset-0 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-xl"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-sm text-text-primary font-medium leading-tight group-hover:text-white transition-colors">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                        {getRelativeTime(item.timestamp)}
                      </span>
                      {item.address && (
                        <a
                          href={`/escrow/${item.address}`}
                          className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-secondary transition-colors"
                        >
                          {shortenAddress(item.address)}
                          <ArrowRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>

      <button className="mt-6 w-full py-3 text-xs font-bold text-text-dim hover:text-text-primary uppercase tracking-widest border-t border-white/5 transition-colors">
        Export History
      </button>
    </div>
  );
}

