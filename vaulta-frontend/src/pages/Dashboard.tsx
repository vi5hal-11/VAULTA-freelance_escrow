import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { FileText, Zap, DollarSign, AlertTriangle, ArrowRight, Plus, Loader2 } from 'lucide-react';

import { useUserEscrows, useEscrowCount } from '@/hooks/useEscrowFactory';
import { useEscrowData } from '@/hooks/useEscrow';
import { useArbitrationData } from '@/hooks/useArbitration';
import StatsCard from '@/components/dashboard/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatEth, getStateLabel, shortenAddress } from '@/lib/utils';

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
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as any } },
};

/* ---- mini card for a single escrow address ---- */
function DashboardEscrowItem({ address, index }: { address: `0x${string}`; index: number }) {
  const data = useEscrowData(address);

  if (data.isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl p-5 text-text-dim text-xs ring-1 ring-white/5">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>{shortenAddress(address)}</span>
      </div>
    );
  }

  const state = Number(data.status ?? 0);
  const totalAmount = data.totalAmount ?? 0n;
  const milestoneCount = Number(data.milestoneCount ?? 0);
  const releasedAmount = data.releasedAmount ?? 0n;
  const currentMilestone = milestoneCount > 0 && totalAmount > 0n
    ? Math.min(Number(releasedAmount * BigInt(milestoneCount) / totalAmount), milestoneCount)
    : 0;
  const jobTitle = data.jobMetadataHash || shortenAddress(address);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/escrow/${address}`}
        className="group/item flex items-center justify-between rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.03] ring-1 ring-transparent hover:ring-white/5"
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-text-primary group-hover/item:text-primary transition-colors truncate">
            {jobTitle}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
              {formatEth(totalAmount)} ETH
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-xs font-medium text-text-muted">
              Milestone {currentMilestone}/{milestoneCount}
            </span>
          </div>
        </div>
        <Badge
          variant={STATE_BADGE_VARIANT[state] ?? 'default'}
          className="capitalize px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
        >
          {getStateLabel(state)}
        </Badge>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { address } = useAccount();
  const { count } = useEscrowCount();
  const { escrows } = useUserEscrows(address);
  const { disputeCount } = useArbitrationData();

  const escrowCount = count !== undefined ? Number(count) : 0;
  const recentEscrows = escrows.slice(0, 5);
  const activeCount = escrows.length;
  const openDisputes = disputeCount !== undefined ? Number(disputeCount) : 0;

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
          title="My Contracts"
          value={activeCount}
          icon={<Zap className="w-6 h-6" />}
          color={STAT_COLORS.active}
        />
        <StatsCard
          title="Total Value Locked"
          value="On-chain"
          icon={<DollarSign className="w-6 h-6" />}
          color={STAT_COLORS.tvl}
        />
        <StatsCard
          title="Open Disputes"
          value={openDisputes}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={STAT_COLORS.disputes}
        />
      </motion.div>

      {/* Chart Section — live data requires indexer (The Graph), coming in V2 */}
      <motion.div variants={fadeUp}>
        <Card className="p-8 flex flex-col items-center justify-center min-h-[180px] gap-3 text-center border-dashed">
          <Zap className="w-8 h-8 text-text-dim" />
          <p className="text-sm font-bold text-text-muted">Live chart data coming soon</p>
          <p className="text-xs text-text-dim">On-chain activity indexing via The Graph — V2 feature</p>
        </Card>
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

          {!address ? (
            <p className="text-sm text-text-muted text-center py-12">Connect your wallet to view contracts.</p>
          ) : recentEscrows.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <p className="text-sm text-text-muted">No contracts yet.</p>
              <Link to="/escrow/create">
                <Button size="sm" variant="secondary">Create your first escrow</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEscrows.map((addr, i) => (
                <DashboardEscrowItem key={addr} address={addr} index={i} />
              ))}
            </div>
          )}

          {escrows.length > 5 && (
            <Link to="/escrows">
              <button className="mt-8 w-full py-4 rounded-xl border border-dashed border-white/10 text-xs font-bold text-text-muted hover:text-text-primary hover:border-white/20 transition-all uppercase tracking-widest">
                View All {escrows.length} Contracts
              </button>
            </Link>
          )}
        </div>

        {/* Activity Feed - 4/12 */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col items-center justify-center gap-3 text-center border-dashed">
            <AlertTriangle className="w-7 h-7 text-text-dim" />
            <p className="text-sm font-bold text-text-muted">Activity feed coming soon</p>
            <p className="text-xs text-text-dim">Requires on-chain event indexing</p>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
