import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  ChevronDown,
  ArrowRight,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUserEscrows } from '@/hooks/useEscrowFactory';
import { useEscrowData } from '@/hooks/useEscrow';
import { shortenAddress, formatEth, getStateLabel, cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

const STATUS_FILTERS = [
  { label: 'All Protocols', value: null },
  { label: 'Initialization', value: 0 },
  { label: 'Funded', value: 1 },
  { label: 'Active', value: 2 },
  { label: 'Arbitration', value: 3 },
  { label: 'Finalized', value: 5 },
] as const;

function getStatusVariant(state: number): BadgeVariant {
  switch (state) {
    case 0: return 'info';
    case 1: return 'warning';
    case 2: return 'warning';
    case 3: return 'danger';
    case 5: return 'success';
    default: return 'default';
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
} as const;

/* ---- per-escrow row that fetches its own data ---- */
function EscrowRow({
  address,
  index,
  searchQuery,
  statusFilter,
  expandedRow,
  onToggle,
}: {
  address: `0x${string}`;
  index: number;
  searchQuery: string;
  statusFilter: number | null;
  expandedRow: string | null;
  onToggle: (a: string) => void;
}) {
  const data = useEscrowData(address);

  if (data.isLoading) {
    return (
      <tr className="border-b border-white/5">
        <td colSpan={6} className="px-8 py-5">
          <div className="flex items-center gap-3 text-text-dim text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading {shortenAddress(address)}...
          </div>
        </td>
      </tr>
    );
  }

  const state = Number(data.status ?? 0);
  const client = data.client ?? '0x';
  const freelancer = data.freelancer ?? '0x';
  const totalAmount = data.totalAmount ?? 0n;
  const milestoneCount = Number(data.milestoneCount ?? 0);
  const releasedAmount = data.releasedAmount ?? 0n;
  const currentMilestone = milestoneCount > 0 && totalAmount > 0n
    ? Math.min(Number(releasedAmount * BigInt(milestoneCount) / totalAmount), milestoneCount)
    : 0;
  const jobTitle = data.jobMetadataHash || shortenAddress(address);

  // Apply filters
  const q = searchQuery.toLowerCase();
  const matchesSearch =
    !q ||
    jobTitle.toLowerCase().includes(q) ||
    address.toLowerCase().includes(q) ||
    client.toLowerCase().includes(q) ||
    freelancer.toLowerCase().includes(q);

  const matchesStatus = statusFilter === null || state === statusFilter;

  if (!matchesSearch || !matchesStatus) return null;

  const isExpanded = expandedRow === address;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onToggle(address)}
      className={cn(
        'group cursor-pointer transition-all hover:bg-primary/[0.02]',
        isExpanded && 'bg-primary/[0.04]'
      )}
    >
      <td className="px-8 py-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-text-dim group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-primary transition-all duration-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-text-primary leading-tight text-base group-hover:text-primary transition-colors truncate max-w-[200px]">{jobTitle}</p>
            <p className="text-[10px] font-mono text-text-dim/60 mt-1.5 uppercase tracking-wider">{shortenAddress(address, 10)}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="text-xs font-mono text-text-muted">{shortenAddress(client)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
            <span className="text-xs font-mono text-text-dim/60">{shortenAddress(freelancer)}</span>
          </div>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex flex-col">
          <span className="text-base font-black text-text-primary">{formatEth(totalAmount)} <span className="text-[10px] font-bold text-primary">ETH</span></span>
          <span className="text-[9px] text-text-dim uppercase tracking-[0.2em] font-black mt-1">ETH</span>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-white/5 rounded-full min-w-[100px] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: milestoneCount > 0 ? `${(currentMilestone / milestoneCount) * 100}%` : '0%' }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">
            {currentMilestone}<span className="text-text-dim/30 mx-0.5">/</span>{milestoneCount}
          </span>
        </div>
      </td>
      <td className="px-8 py-7">
        <Badge
          variant={getStatusVariant(state)}
          className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border border-white/5"
        >
          {getStateLabel(state)}
        </Badge>
      </td>
      <td className="px-8 py-7 text-right">
        <div className="flex items-center justify-end gap-6">
          <Link to={`/escrow/${address}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary rounded-xl px-4 border border-transparent hover:border-primary/20 transition-all duration-300">
              Overview
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </Link>
          <ChevronDown className={cn(
            'h-5 w-5 text-text-dim/30 transition-transform duration-500',
            isExpanded && 'rotate-180 text-primary'
          )} />
        </div>
      </td>
    </motion.tr>
  );
}

export default function EscrowList() {
  const { address: userAddress } = useAccount();
  const { escrows, isLoading } = useUserEscrows(userAddress);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (address: string) => {
    setExpandedRow((prev) => (prev === address ? null : address));
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 pb-20"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            V3 Protocol Registry
          </motion.div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Active Escrows</h1>
          <p className="text-text-muted font-medium max-w-xl">
            Audit and manage your secure service agreements. Every contract is backed by an immutable on-chain state machine.
          </p>
        </div>
        <Link to="/escrow/create">
          <Button variant="primary" size="xl" className="shadow-glow-primary px-8 group">
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Launch New Escrow
          </Button>
        </Link>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={itemVariants} className="glass-card p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
          <input
            type="text"
            placeholder="Search registry by title, address, or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/[0.03] border border-white/5 pl-12 pr-4 py-3.5 text-sm text-text-primary placeholder-text-dim/30 outline-none transition-all focus:bg-white/[0.05] focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto px-2 lg:px-0 py-1 no-scrollbar">
          <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/5 whitespace-nowrap">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  statusFilter === filter.value
                    ? 'text-text-primary'
                    : 'text-text-dim hover:text-text-muted'
                )}
              >
                {filter.label}
                {statusFilter === filter.value && (
                  <motion.div
                    layoutId="filterActive"
                    className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* List Container */}
      <motion.div variants={itemVariants}>
        {!userAddress ? (
          <Card className="flex flex-col items-center justify-center py-32 glass-card border-none bg-white/[0.01]">
            <h3 className="text-2xl font-black text-text-primary tracking-tight">Connect Your Wallet</h3>
            <p className="text-sm text-text-muted mt-3 max-w-xs text-center font-medium leading-relaxed">
              Connect a wallet to view your escrow contracts.
            </p>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-32 text-text-dim">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-sm font-bold uppercase tracking-widest">Loading contracts...</span>
          </div>
        ) : escrows.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-32 glass-card border-none bg-white/[0.01]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <Search className="h-10 w-10 text-text-dim/20" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight">No Protocols Found</h3>
            <p className="text-sm text-text-muted mt-3 max-w-xs text-center font-medium leading-relaxed">
              You have no escrow contracts yet. Launch your first one to get started.
            </p>
            <div className="mt-10 flex gap-4">
              <Link to="/escrow/create">
                <Button variant="primary" size="lg" className="px-8 shadow-glow-primary">
                  Launch First Escrow
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="glass-card-hover overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Agreement / ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Parties</th>
                    <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Commitment</th>
                    <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Lifecycle</th>
                    <th className="px-8 py-5 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {escrows.map((addr, index) => (
                    <EscrowRow
                      key={addr}
                      address={addr}
                      index={index}
                      searchQuery={searchQuery}
                      statusFilter={statusFilter}
                      expandedRow={expandedRow}
                      onToggle={toggleRow}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
