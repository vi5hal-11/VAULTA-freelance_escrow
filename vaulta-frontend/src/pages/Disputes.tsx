import { useState, useMemo } from 'react';
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
  ChevronRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useArbitrationActions } from '@/hooks/useArbitration';
import { useStore } from '@/store/useStore';
import { shortenAddress, cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface MockJuror {
  address: `0x${string}`;
  stake: string;
  voted: boolean;
}

interface MockDispute {
  id: number;
  escrow: `0x${string}`;
  project: string;
  status: 'Voting' | 'Resolved';
  clientVotes: number;
  freelancerVotes: number;
  totalJurors: number;
  client: `0x${string}`;
  freelancer: `0x${string}`;
  amount: string;
  winner?: 'client' | 'freelancer';
  jurors: MockJuror[];
}

const MOCK_DISPUTES: MockDispute[] = [
  {
    id: 1,
    escrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
    project: 'Liquid Stake Integration',
    status: 'Voting',
    clientVotes: 1,
    freelancerVotes: 0,
    totalJurors: 3,
    client: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    freelancer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
    amount: '6.45',
    jurors: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`, stake: '0.15', voted: true },
      { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as `0x${string}`, stake: '0.12', voted: false },
      { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' as `0x${string}`, stake: '0.10', voted: false },
    ],
  },
  {
    id: 2,
    escrow: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
    project: 'zk-Rollup Connector',
    status: 'Resolved',
    clientVotes: 2,
    freelancerVotes: 1,
    totalJurors: 3,
    client: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    freelancer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
    amount: '12.0',
    winner: 'client',
    jurors: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`, stake: '0.25', voted: true },
      { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as `0x${string}`, stake: '0.18', voted: true },
      { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' as `0x${string}`, stake: '0.11', voted: true },
    ],
  },
  {
    id: 3,
    escrow: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as `0x${string}`,
    project: 'Multisig Factory v2',
    status: 'Voting',
    clientVotes: 1,
    freelancerVotes: 1,
    totalJurors: 3,
    client: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    freelancer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
    amount: '3.2',
    jurors: [
      { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`, stake: '0.15', voted: true },
      { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as `0x${string}`, stake: '0.12', voted: true },
      { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' as `0x${string}`, stake: '0.10', voted: false },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
} as const;

export default function Disputes() {
  const { address: userAddress } = useAccount();
  const { actions, isPending } = useArbitrationActions();
  const addToast = useStore((s) => s.addToast);

  const [selectedId, setSelectedId] = useState<number>(1);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [mobileTab, setMobileTab] = useState<'list' | 'details'>('list');

  const selected = useMemo(() => 
    MOCK_DISPUTES.find((d) => d.id === selectedId) ?? MOCK_DISPUTES[0]
  , [selectedId]);

  const isJuror = useMemo(() => 
    userAddress ? selected.jurors.some((j) => j.address.toLowerCase() === userAddress.toLowerCase()) : false
  , [userAddress, selected.jurors]);

  const handleVote = (decision: number) => {
    actions.vote(selected.id, decision);
    addToast({ type: 'pending', message: `Voting on case #${selected.id}...` });
  };

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
              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Juror Eligibility</span>
              <span className="text-sm font-bold text-text-muted">High Reputation Tier</span>
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
            <Badge variant="info" className="text-[9px] font-black uppercase">{MOCK_DISPUTES.length}</Badge>
          </div>
          
          <div className="space-y-4">
            {MOCK_DISPUTES.map((d) => (
              <motion.div
                key={d.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedId(d.id);
                  setMobileTab('details');
                }}
                className={cn(
                  "p-5 rounded-3xl cursor-pointer transition-all border relative overflow-hidden",
                  selectedId === d.id 
                    ? "bg-secondary/10 border-secondary/30 ring-1 ring-secondary/20" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                )}
              >
                {selectedId === d.id && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute inset-y-0 left-0 w-1 bg-secondary shadow-[0_0_12px_hsla(var(--accent-secondary)/0.5)]" 
                  />
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Case ID #{d.id}</p>
                    <p className="font-bold text-text-primary leading-tight">{d.project}</p>
                  </div>
                  <Badge
                    variant={d.status === 'Resolved' ? 'success' : 'warning'}
                    className="text-[9px] font-black uppercase tracking-widest px-2"
                  >
                    {d.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                   <div className="flex items-center gap-1.5 text-text-muted font-medium">
                      <Users className="w-3.5 h-3.5 text-text-dim" />
                      {d.clientVotes + d.freelancerVotes} / {d.totalJurors} Quorum
                   </div>
                   <div className="flex items-center gap-1 text-text-dim font-bold font-mono">
                      {d.amount} ETH
                   </div>
                </div>
              </motion.div>
            ))}
          </div>

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

        {/* Case Findings Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Main Header Card */}
            <Card className="p-8 border-none bg-white/[0.01]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h2 className="text-3xl font-black text-text-primary tracking-tight">Case Overview</h2>
                       <Badge variant={selected.status === 'Resolved' ? 'success' : 'info'} className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase">
                          {selected.status}
                       </Badge>
                    </div>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">Secure Escrow Protocol Registry</p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5">
                       <ExternalLink className="w-4 h-4 mr-2" />
                       Explorer
                    </Button>
                    <Button variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5">
                       <ArrowRight className="w-4 h-4" />
                    </Button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
                       <Scale className="w-3.5 h-3.5" /> Protocols
                    </div>
                    <div>
                       <p className="text-sm font-bold text-text-primary">Disputed Amount</p>
                       <p className="text-2xl font-black text-secondary">{selected.amount} ETH</p>
                    </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
                       <Users className="w-3.5 h-3.5" /> Registry
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-text-muted">Parties</span>
                          <span className="text-[10px] font-mono text-text-muted/60">{shortenAddress(selected.escrow, 6)}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/20" />
                          <div className="w-4 h-4 rounded-full bg-secondary/20 border border-secondary/20 -ml-2" />
                       </div>
                    </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
                       <Shield className="w-3.5 h-3.5" /> Jurisdiction
                    </div>
                    <div>
                       <p className="text-sm font-bold text-text-primary">Network Status</p>
                       <Badge variant="success" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>
                    </div>
                 </div>
              </div>
            </Card>

            {/* Adjudication Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8">
                 <h3 className="text-xl font-black text-text-primary tracking-tight mb-8">Protocol Finding</h3>
                 
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-primary flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsla(var(--accent-primary)/1)]" />
                             Favoring Client
                          </span>
                          <span className="text-text-muted">{selected.clientVotes} / {selected.totalJurors}</span>
                       </div>
                       <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(selected.clientVotes / selected.totalJurors) * 100}%` }}
                            className="h-full bg-primary"
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-secondary flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsla(var(--accent-secondary)/1)]" />
                             Favoring Freelancer
                          </span>
                          <span className="text-text-muted">{selected.freelancerVotes} / {selected.totalJurors}</span>
                       </div>
                       <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(selected.freelancerVotes / selected.totalJurors) * 100}%` }}
                            className="h-full bg-secondary"
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          />
                       </div>
                    </div>
                 </div>

                 {selected.status === 'Resolved' && selected.winner && (
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
                       <p className="text-sm text-text-muted font-medium mt-1">Resolution favored the <span className="text-green-500 font-bold uppercase">{selected.winner}</span>. Funds have been triaged.</p>
                     </div>
                   </motion.div>
                 )}

                 {selected.status === 'Voting' && (
                   <div className="mt-10 space-y-4">
                      {isJuror ? (
                        <div className="space-y-4">
                           <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 flex items-center gap-3">
                              <Info className="w-4 h-4 text-secondary shrink-0" />
                              <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">Assigned Juror Identity Detected. Casting vote is required for quorum.</p>
                           </div>
                           <div className="flex gap-4">
                              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[11px] tracking-widest h-12 shadow-glow-primary" onClick={() => handleVote(1)} loading={isPending}>
                                Resolve to Client
                              </Button>
                              <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-black uppercase text-[11px] tracking-widest h-12 shadow-glow-secondary" onClick={() => handleVote(2)} loading={isPending}>
                                Resolve to Freelancer
                              </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                           <AlertCircle className="w-6 h-6 text-text-dim shrink-0" />
                           <p className="text-xs text-text-dim font-medium leading-relaxed">Your identity has not been selected for this adjudication cycle. Monitoring status only.</p>
                        </div>
                      )}
                   </div>
                 )}
              </Card>

              {/* Juror Registry Details */}
              <Card className="p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-text-primary tracking-tight">Juror Panel</h3>
                    <Badge variant="default" className="text-[10px] uppercase font-black tracking-widest">Quorum V3</Badge>
                 </div>
                 
                 <div className="space-y-4">
                    {selected.jurors.map((juror, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-[10px] font-black text-white/50 border border-white/10 group-hover:border-primary/50 transition-all">
                            0{i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-mono font-bold text-text-primary tracking-tight">
                              {shortenAddress(juror.address, 8)}
                            </p>
                            <p className="text-[10px] text-text-dim font-black uppercase tracking-widest mt-1">
                              Stake: <span className="text-text-muted">{juror.stake} ETH</span>
                            </p>
                          </div>
                        </div>
                        <Badge variant={juror.voted ? 'success' : 'default'} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                          {juror.voted ? 'Committed' : 'Awaiting'}
                        </Badge>
                      </div>
                    ))}
                 </div>

                 <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-text-dim uppercase tracking-widest">
                       <span>Inactivity Slashing</span>
                       <span className="text-secondary">ENABLED</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-text-dim uppercase tracking-widest">
                       <span>Juror Rewards pool</span>
                       <span className="text-primary">0.05 ETH</span>
                    </div>
                 </div>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
