import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { FileText, Zap, DollarSign, AlertTriangle, ArrowRight, Plus } from 'lucide-react';

import { useUserEscrows, useEscrowCount } from '@/hooks/useEscrowFactory';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import EscrowChart from '@/components/dashboard/EscrowChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  MOCK_ESCROWS,
  MOCK_ACTIVITY,
  MOCK_CHART_DATA,
} from '@/lib/mockData';
import { getStateLabel, cn } from '@/lib/utils';

const STATE_BADGE_VARIANT: Record<number, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  0: 'info',
  1: 'warning',
  2: 'warning',
  3: 'danger',
  4: 'default',
  5: 'success',
};

const STAT_COLORS = {
  escrows: '#818cf8',
  active: '#2dd4bf',
  tvl: '#34d399',
  disputes: '#fb7185',
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as any } },
};

export default function Dashboard() {
  const { address } = useAccount();
  const { count } = useEscrowCount();
  const { escrows } = useUserEscrows(address);

  const escrowCount = count !== undefined ? Number(count) : 12;
  const activeCount = escrows.length > 0 ? escrows.length : 5;

  const recentEscrows = MOCK_ESCROWS.slice(0, 5);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-10 pb-12"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">
            Dashboard<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-text-muted font-medium">
            Real-time overview of your decentralized escrow operations.
          </p>
        </div>
        <Link to="/escrow/create">
          <Button size="lg" className="shadow-glow-primary">
            <Plus className="w-5 h-5 mr-1" />
            Create New Escrow
          </Button>
        </Link>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Total Escrows"
          value={escrowCount}
          icon={<FileText className="w-6 h-6" />}
          color={STAT_COLORS.escrows}
        />
        <StatsCard
          title="Active Contracts"
          value={activeCount}
          icon={<Zap className="w-6 h-6" />}
          color={STAT_COLORS.active}
        />
        <StatsCard
          title="Total Value Locked"
          value="24.5 ETH"
          icon={<DollarSign className="w-6 h-6" />}
          color={STAT_COLORS.tvl}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Open Disputes"
          value={2}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={STAT_COLORS.disputes}
          trend={{ value: 5, positive: false }}
        />
      </motion.div>

      {/* Chart Section */}
      <motion.div variants={fadeUp}>
        <EscrowChart data={MOCK_CHART_DATA} />
      </motion.div>

      {/* Bottom Grid */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Recent Escrows - 8/12 */}
        <div className="lg:col-span-8 glass-card p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em]">
                Recent Contracts
              </h3>
              <p className="text-xs text-text-dim mt-1">Status of your latest engagements</p>
            </div>
            <Link
              to="/escrows"
              className="group/link flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-secondary transition-colors"
            >
              View All Contracts
              <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentEscrows.map((escrow, i) => (
              <motion.div
                key={escrow.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  to={`/escrow/${escrow.address}`}
                  className="group/item flex items-center justify-between rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.03] ring-1 ring-transparent hover:ring-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-text-primary group-hover/item:text-primary transition-colors truncate">
                      {escrow.jobTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
                        {escrow.totalAmount} ETH
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-xs font-medium text-text-muted">
                        Milestone {escrow.currentMilestone}/{escrow.milestoneCount}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={STATE_BADGE_VARIANT[escrow.state] ?? 'default'}
                    className="capitalize px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    {getStateLabel(escrow.state)}
                  </Badge>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <button className="mt-8 w-full py-4 rounded-xl border border-dashed border-white/10 text-xs font-bold text-text-muted hover:text-text-primary hover:border-white/20 transition-all uppercase tracking-widest">
            Load More History
          </button>
        </div>

        {/* Activity Feed - 4/12 */}
        <div className="lg:col-span-4">
          <ActivityFeed activities={MOCK_ACTIVITY} />
        </div>
      </motion.div>
    </motion.div>
  );
}

