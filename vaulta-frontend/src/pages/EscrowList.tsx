import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  FileText,
  ChevronDown,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_ESCROWS } from '@/lib/mockData';
import { shortenAddress, getStateLabel, cn } from '@/lib/utils';

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
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
} as const;

export default function EscrowList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredEscrows = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return [...MOCK_ESCROWS]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter((escrow) => {
        const matchesSearch =
          !query ||
          escrow.jobTitle.toLowerCase().includes(query) ||
          escrow.address.toLowerCase().includes(query) ||
          escrow.client.toLowerCase().includes(query) ||
          escrow.freelancer.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === null || escrow.state === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [searchQuery, statusFilter]);

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
        {/* Search */}
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

        {/* Filters */}
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
        {filteredEscrows.length > 0 ? (
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
                  {filteredEscrows.map((escrow, index) => (
                    <motion.tr
                      key={escrow.address}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => toggleRow(escrow.address)}
                      className={cn(
                        "group cursor-pointer transition-all hover:bg-primary/[0.02]",
                        expandedRow === escrow.address && "bg-primary/[0.04]"
                      )}
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-text-dim group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-primary transition-all duration-300">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-text-primary leading-tight text-base group-hover:text-primary transition-colors">{escrow.jobTitle}</p>
                            <p className="text-[10px] font-mono text-text-dim/60 mt-1.5 uppercase tracking-wider">{shortenAddress(escrow.address, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 group/addr">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/addr:bg-primary transition-colors" />
                             <span className="text-xs font-mono text-text-muted">{shortenAddress(escrow.client)}</span>
                          </div>
                          <div className="flex items-center gap-2 group/addr">
                             <div className="w-1.5 h-1.5 rounded-full bg-secondary/40 group-hover/addr:bg-secondary transition-colors" />
                             <span className="text-xs font-mono text-text-dim/60">{shortenAddress(escrow.freelancer)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                           <span className="text-base font-black text-text-primary">{escrow.totalAmount} <span className="text-[10px] font-bold text-primary">ETH</span></span>
                           <span className="text-[9px] text-text-dim uppercase tracking-[0.2em] font-black mt-1">Native Swap</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-2 bg-white/5 rounded-full min-w-[100px] overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(escrow.currentMilestone / escrow.milestoneCount) * 100}%` }}
                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_8px_hsla(var(--accent-primary)/0.4)]"
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                           </div>
                           <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">{escrow.currentMilestone}<span className="text-text-dim/30 mx-0.5">/</span>{escrow.milestoneCount}</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <Badge
                          variant={getStatusVariant(escrow.state)}
                          className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border border-white/5"
                        >
                          {getStateLabel(escrow.state)}
                        </Badge>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex items-center justify-end gap-6">
                          <Link to={`/escrow/${escrow.address}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary rounded-xl px-4 border border-transparent hover:border-primary/20 transition-all duration-300">
                              Overview
                              <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-text-dim/30 transition-transform duration-500",
                            expandedRow === escrow.address && "rotate-180 text-primary"
                          )} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-32 glass-card border-none bg-white/[0.01]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <Search className="h-10 w-10 text-text-dim/20" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight">No Protocols Found</h3>
            <p className="text-sm text-text-muted mt-3 max-w-xs text-center font-medium leading-relaxed">
              We couldn't find any escrow contracts matching your current filters or search criteria.
            </p>
            <div className="mt-10 flex gap-4">
               <Button variant="secondary" size="lg" className="px-8" onClick={() => { setSearchQuery(''); setStatusFilter(null); }}>
                 Reset Filters
               </Button>
               <Link to="/escrow/create">
                 <Button variant="primary" size="lg" className="px-8 shadow-glow-primary">
                   Launch First Escrow
                 </Button>
               </Link>
            </div>
          </Card>
        )}
      </motion.div>
      
      {/* Background Decor */}
      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
