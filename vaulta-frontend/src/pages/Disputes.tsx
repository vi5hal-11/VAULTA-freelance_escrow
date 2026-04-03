import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { parseEther } from 'viem';
import {
  Scale,
  Users,
  Shield,
  DollarSign,
  CheckCircle,
  Gavel,
  ArrowRight,
  Info,
  ExternalLink,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useArbitrationData,
  useDisputeInfo,
  useDisputeEscrow,
  useJurorStatus,
  useArbitrationActions,
} from '@/hooks/useArbitration';
import { useEscrowData } from '@/hooks/useEscrow';
import { useStore } from '@/store/useStore';
import { shortenAddress, formatEth, cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
} as const;

/* ---- per-dispute sidebar card ---- */
function DisputeCard({
  disputeId,
  isSelected,
  onClick,
}: {
  disputeId: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { clientVotes, freelancerVotes, resolved, isLoading } = useDisputeInfo(disputeId);
  const { escrow } = useDisputeEscrow(disputeId);
  const escrowData = useEscrowData(escrow);

  const totalVotes = Number(clientVotes ?? 0) + Number(freelancerVotes ?? 0);
  const status = resolved ? 'Resolved' : 'Voting';
  const amount = escrowData.totalAmount;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'p-5 rounded-3xl cursor-pointer transition-all border relative overflow-hidden',
        isSelected
          ? 'bg-secondary/10 border-secondary/30 ring-1 ring-secondary/20'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-y-0 left-0 w-1 bg-secondary shadow-[0_0_12px_hsla(var(--accent-secondary)/0.5)]"
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-xs py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading case #{disputeId}...
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Case ID #{disputeId}</p>
              <p className="font-bold text-text-primary leading-tight">
                {escrow ? shortenAddress(escrow, 6) : '...'}
              </p>
            </div>
            <Badge
              variant={status === 'Resolved' ? 'success' : 'warning'}
              className="text-[9px] font-black uppercase tracking-widest px-2"
            >
              {status}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-text-muted font-medium">
              <Users className="w-3.5 h-3.5 text-text-dim" />
              {totalVotes} / 3 Quorum
            </div>
            <div className="flex items-center gap-1 text-text-dim font-bold font-mono">
              {amount !== undefined ? `${formatEth(amount)} ETH` : '—'}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ---- dispute detail panel ---- */
function DisputeDetail({
  disputeId,
  userAddress,
}: {
  disputeId: number;
  userAddress: `0x${string}` | undefined;
}) {
  const { jurors, clientVotes, freelancerVotes, resolved, isLoading } = useDisputeInfo(disputeId);
  const { escrow } = useDisputeEscrow(disputeId);
  const escrowData = useEscrowData(escrow);
  const { actions, isPending } = useArbitrationActions();
  const addToast = useStore((s) => s.addToast);

  const isJuror = userAddress
    ? jurors.some((j) => j.toLowerCase() === userAddress.toLowerCase())
    : false;

  const status = resolved ? 'Resolved' : 'Voting';
  const totalJurors = 3;
  const cVotes = Number(clientVotes ?? 0);
  const fVotes = Number(freelancerVotes ?? 0);
  const winner = resolved ? (cVotes >= fVotes ? 'client' : 'freelancer') : undefined;

  const handleVote = (decision: number) => {
    actions.vote(disputeId, decision);
    addToast({ type: 'pending', message: `Voting on case #${disputeId}...` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-text-dim">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span className="text-sm font-bold uppercase tracking-widest">Loading case #{disputeId}...</span>
      </div>
    );
  }

  return (
    <motion.div
      key={disputeId}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Main Header Card */}
      <Card className="p-8 border-none bg-white/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-text-primary tracking-tight">Case Overview</h2>
              <Badge variant={status === 'Resolved' ? 'success' : 'info'} className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase">
                {status}
              </Badge>
            </div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">Secure Escrow Protocol Registry</p>
          </div>

          <div className="flex items-center gap-2">
            {escrow && (
              <a href={`https://sepolia.etherscan.io/address/${escrow}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explorer
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
              <Scale className="w-3.5 h-3.5" /> Disputed Amount
            </div>
            <div>
              <p className="text-2xl font-black text-secondary">
                {escrowData.totalAmount !== undefined ? `${formatEth(escrowData.totalAmount)} ETH` : '—'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
              <Users className="w-3.5 h-3.5" /> Parties
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/20" />
                <span className="text-xs font-mono text-text-muted">
                  {escrowData.client ? shortenAddress(escrowData.client) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary/20 border border-secondary/20" />
                <span className="text-xs font-mono text-text-muted">
                  {escrowData.freelancer ? shortenAddress(escrowData.freelancer) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
              <Shield className="w-3.5 h-3.5" /> Network Status
            </div>
            <div>
              <Badge variant="success" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Voting & Jurors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Protocol Finding</h3>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Favoring Client
                </span>
                <span className="text-text-muted">{cVotes} / {totalJurors}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(cVotes / totalJurors) * 100}%` }}
                  className="h-full bg-primary"
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-secondary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  Favoring Freelancer
                </span>
                <span className="text-text-muted">{fVotes} / {totalJurors}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(fVotes / totalJurors) * 100}%` }}
                  className="h-full bg-secondary"
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>

          {status === 'Resolved' && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 p-6 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-text-primary uppercase tracking-widest">Protocol Finalized</p>
                <p className="text-sm text-text-muted font-medium mt-1">
                  Resolution favored the <span className="text-green-500 font-bold uppercase">{winner}</span>. Funds have been distributed.
                </p>
              </div>
            </motion.div>
          )}

          {status === 'Voting' && (
            <div className="mt-10 space-y-4">
              {isJuror ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 flex items-center gap-3">
                    <Info className="w-4 h-4 text-secondary shrink-0" />
                    <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">
                      Assigned Juror Identity Detected. Casting vote is required for quorum.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[11px] tracking-widest h-12 shadow-glow-primary"
                      onClick={() => handleVote(0)}
                      loading={isPending}
                    >
                      Resolve to Client
                    </Button>
                    <Button
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-black uppercase text-[11px] tracking-widest h-12 shadow-glow-secondary"
                      onClick={() => handleVote(1)}
                      loading={isPending}
                    >
                      Resolve to Freelancer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                  <AlertCircle className="w-6 h-6 text-text-dim shrink-0" />
                  <p className="text-xs text-text-dim font-medium leading-relaxed">
                    Your identity has not been selected for this adjudication cycle. Monitoring status only.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Juror Panel */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-text-primary tracking-tight">Juror Panel</h3>
            <Badge variant="default" className="text-[10px] uppercase font-black tracking-widest">Quorum V3</Badge>
          </div>

          <div className="space-y-4">
            {jurors.length === 0 ? (
              <p className="text-xs text-text-dim text-center py-8">No jurors assigned yet.</p>
            ) : (
              jurors.map((juror, i) => (
                <div
                  key={juror}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-[10px] font-black text-white/50 border border-white/10">
                      0{i + 1}
                    </div>
                    <p className="text-xs font-mono font-bold text-text-primary tracking-tight">
                      {shortenAddress(juror, 8)}
                    </p>
                  </div>
                  <Badge variant="default" className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    Juror
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-dim uppercase tracking-widest">
              <span>Inactivity Slashing</span>
              <span className="text-secondary">ENABLED</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-text-dim uppercase tracking-widest">
              <span>Required Quorum</span>
              <span className="text-primary">2 / 3</span>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

export default function Disputes() {
  const { address: userAddress } = useAccount();
  const { disputeCount, isLoading: loadingCount } = useArbitrationData();
  const { actions, isPending } = useArbitrationActions();
  const addToast = useStore((s) => s.addToast);
  const { stake: jurorStake } = useJurorStatus(userAddress);

  const [selectedId, setSelectedId] = useState<number>(1);
  const [stakeAmount, setStakeAmount] = useState('0.1');

  const total = disputeCount !== undefined ? Number(disputeCount) : 0;
  const disputeIds = Array.from({ length: total }, (_, i) => i + 1);

  const handleStake = () => {
    if (!stakeAmount) return;
    try {
      actions.stake(parseEther(stakeAmount));
      addToast({ type: 'pending', message: 'Initiating staking protocol...' });
    } catch {
      addToast({ type: 'error', message: 'Failed to stake assets' });
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-12 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest">
            <Gavel className="w-3 h-3" />
            Justice Protocol v4
          </div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Active Arbitration</h1>
          <p className="text-text-muted font-medium max-w-xl">
            Neutral resolution of decentralized service agreements. Stake assets to participate in the security of the network.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Your Stake</span>
            <span className="text-sm font-bold text-text-muted">
              {jurorStake !== undefined ? `${formatEth(jurorStake)} ETH` : '0 ETH'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* Cases Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.2em]">Live Cases</h2>
            <Badge variant="info" className="text-[9px] font-black uppercase">{total}</Badge>
          </div>

          {loadingCount ? (
            <div className="flex items-center gap-2 text-text-dim text-xs px-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading disputes...
            </div>
          ) : disputeIds.length === 0 ? (
            <p className="text-xs text-text-dim px-2">No disputes on-chain yet.</p>
          ) : (
            <div className="space-y-4">
              {disputeIds.map((id) => (
                <DisputeCard
                  key={id}
                  disputeId={id}
                  isSelected={selectedId === id}
                  onClick={() => setSelectedId(id)}
                />
              ))}
            </div>
          )}

          {/* Become a Juror CTA */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Protocol Stake</Badge>
            </div>
            <h3 className="text-base font-black text-text-primary mb-2">Network Security</h3>
            <p className="text-xs text-text-muted leading-relaxed font-medium mb-6">
              Stake ETH to secure the justice protocol and earn adjudication rewards from case fees.
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Stake Amount (ETH)"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-white/[0.03] border-white/10"
              />
              <Button variant="primary" className="w-full shadow-glow-primary" onClick={handleStake} loading={isPending}>
                Initiate Staking
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Case Detail Panel */}
        <AnimatePresence mode="wait">
          {total === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <Scale className="w-16 h-16 text-text-dim/20 mb-6" />
              <h3 className="text-2xl font-black text-text-primary tracking-tight">No Active Cases</h3>
              <p className="text-sm text-text-muted mt-3 max-w-xs font-medium leading-relaxed">
                There are no disputes on the network yet. Disputes appear here when raised from escrow contracts.
              </p>
            </motion.div>
          ) : (
            <DisputeDetail key={selectedId} disputeId={selectedId} userAddress={userAddress} />
          )}
        </AnimatePresence>
      </div>

      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
