import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { parseEther } from 'viem';
import {
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Clock,
  DollarSign,
  Upload,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
  Zap,
  ArrowRight,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useEscrowData, useEscrowActions } from '@/hooks/useEscrow';
import { useStore } from '@/store/useStore';
import {
  shortenAddress,
  formatEth,
  getStateLabel,
  cn,
} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Timeline Logic                                                      */
/* ------------------------------------------------------------------ */

function getTimelineSteps(state: number, milestoneCount: number, currentMilestone: number) {
  const steps: { label: string; description: string; status: 'done' | 'current' | 'future' }[] = [
    { label: 'Initialization', description: 'Contract created', status: state >= 0 ? (state > 0 ? 'done' : 'current') : 'future' },
    { label: 'Funding', description: 'Collateral secured', status: state >= 1 ? (state > 1 ? 'done' : 'current') : 'future' },
    { label: 'Activation', description: 'Work in progress', status: state >= 2 ? (state > 2 ? 'done' : 'current') : 'future' },
  ];

  for (let i = 0; i < milestoneCount; i++) {
    const isDone = i < currentMilestone;
    const isCurrent = i === currentMilestone && state === 2;
    steps.push({
      label: `Phase ${i + 1}`,
      description: `Milestone ${i + 1} processing`,
      status: isDone ? 'done' : isCurrent ? 'current' : 'future',
    });
  }

  steps.push({
    label: 'Completion',
    description: 'Agreement finalized',
    status: state >= 5 ? 'done' : 'future',
  });

  return steps;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
} as const;

export default function ContractDetails() {
  const { address } = useParams<{ address: string }>();
  const escrowAddress = address as `0x${string}` | undefined;
  const { address: userAddress } = useAccount();
  const addToast = useStore((s) => s.addToast);

  const escrowData = useEscrowData(escrowAddress);
  const { actions, isPending } = useEscrowActions(escrowAddress);

  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  
  // Real data state
  const isLoading = escrowData.isLoading;
  const data = escrowData;

  const state = (data.state as number) ?? 0;
  const client = data.client;
  const freelancer = data.freelancer;
  const totalAmount = data.totalAmount;
  const currentMilestone = Number(data.currentMilestone ?? 0);
  const milestoneCount = Number(data.milestoneCount ?? 0);
  const jobMetadataHash = data.jobMetadataHash;
  const token = data.token;

  const isClient = userAddress && client && userAddress.toLowerCase() === client.toLowerCase();
  const isFreelancer = userAddress && freelancer && userAddress.toLowerCase() === freelancer.toLowerCase();

  const timelineSteps = getTimelineSteps(state, milestoneCount, currentMilestone);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const STATE_BADGE_VARIANT: Record<number, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
    0: 'info',
    1: 'warning',
    2: 'warning',
    3: 'danger',
    4: 'default',
    5: 'success',
  };

  /* ---- action handlers ---- */
  const handleFund = () => {
    if (!fundAmount) return;
    actions.fundEscrow(parseEther(fundAmount));
    addToast({ type: 'pending', message: 'Broadcasting funding transaction...' });
  };

  const handleAcceptJob = () => {
    actions.acceptJob();
    addToast({ type: 'pending', message: 'Broadcasting acceptance...' });
  };

  const handleSubmitMilestone = () => {
    actions.submitMilestone(currentMilestone);
    addToast({ type: 'pending', message: `Submitting deliverables for phase ${currentMilestone + 1}...` });
  };

  const handleApproveMilestone = () => {
    actions.approveMilestone(currentMilestone);
    addToast({ type: 'pending', message: `Approving Phase ${currentMilestone + 1}...` });
  };

  const handleReleasePayment = () => {
    actions.releaseMilestonePayment(currentMilestone);
    addToast({ type: 'pending', message: `Releasing Phase ${currentMilestone + 1} funds...` });
  };

  const handleRaiseDispute = () => {
    actions.raiseDispute(0);
    addToast({ type: 'pending', message: 'Initiating arbitration...' });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-10 pb-20"
    >
      {/* Header & Meta */}
      <motion.div variants={itemVariants} className="flex flex-col gap-6">
        <Link
          to="/escrows"
          className="group inline-flex items-center gap-2 text-xs font-bold text-text-dim hover:text-text-primary uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Back to Registry
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-text-primary tracking-tight">Contract Overview</h1>
              <Badge
                variant={STATE_BADGE_VARIANT[state]}
                className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg"
              >
                {getStateLabel(state)}
              </Badge>
            </div>
            <button
              onClick={copyAddress}
              className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all font-mono text-sm text-text-dim"
            >
              <span className="truncate max-w-[200px] sm:max-w-none">{address}</span>
              {copied ? (
                <Check className="h-4 w-4 text-status-success" />
              ) : (
                <Copy className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-8 px-8 py-6 rounded-3xl bg-primary/5 border border-primary/10 backdrop-blur-xl">
             <div className="text-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1">Contract Value</p>
               <p className="text-2xl font-black text-text-primary">{formatEth(totalAmount ?? 0n)} <span className="text-sm font-bold text-primary">ETH</span></p>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="text-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1">Progress</p>
               <p className="text-2xl font-black text-text-primary">{currentMilestone}<span className="text-text-dim">/</span>{milestoneCount}</p>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline & Parties */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Enhanced Timeline */}
          <motion.div variants={itemVariants} className="glass-card p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[64px] rounded-full" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em] mb-10 pb-4 border-b border-white/5">
              Protocol Execution Timeline
            </h3>

            <div className="relative space-y-0 pl-4 sm:pl-0">
              {/* Vertical line for mobile, pseudo for layout */}
              <div className="hidden sm:block absolute top-[1.35rem] left-[1.35rem] right-[1.35rem] h-0.5 bg-white/5" />
              <div className="sm:hidden absolute top-4 left-4 bottom-4 w-0.5 bg-white/5" />

              <div className="flex flex-col sm:flex-row justify-between gap-10">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="relative flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-4 z-10 sm:flex-1">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-700",
                      step.status === 'done' && "bg-status-success/20 border-status-success text-status-success shadow-[0_0_15px_hsla(var(--status-success)/0.3)]",
                      step.status === 'current' && "bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsla(var(--accent-primary)/0.3)]",
                      step.status === 'future' && "bg-white/5 border-white/10 text-text-dim"
                    )}>
                      {step.status === 'done' ? <Check className="w-5 h-5 stroke-[3px]" /> : <Clock className="w-5 h-5 stroke-[2px]" />}
                    </div>
                    <div className="flex flex-col sm:items-center">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        step.status === 'future' ? "text-text-dim" : "text-text-primary"
                      )}>{step.label}</span>
                      <span className="text-[9px] font-medium text-text-muted/60 whitespace-nowrap">{step.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Action Center - Premium Glow Card */}
          <motion.div variants={itemVariants} className="glass-card p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover:opacity-80 transition-opacity" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-5 w-5 fill-current" />
                  <h3 className="text-xl font-black text-text-primary tracking-tight">Contract Command Center</h3>
                </div>
                <p className="text-sm text-text-muted font-medium leading-relaxed">
                  {state === 0 ? "Seed the contract with collateral to initiate the work cycle." : 
                   state === 1 ? "The freelancer must accept the job parameters to proceed." :
                   state === 2 ? "Manage deliverables and payments for the active engagement." :
                   "The contract term has concluded or entered arbitration."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 min-w-fit">
                <AnimatePresence mode="wait">
                  {/* Client Funding Flow */}
                  {state === 0 && isClient && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex bg-white/5 p-2 rounded-2xl border border-white/10 gap-2 w-full md:w-auto"
                    >
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="bg-transparent border-none outline-none text-text-primary font-bold px-4 py-2 w-24 text-sm"
                      />
                      <Button loading={isPending} onClick={handleFund} className="shadow-lg shadow-primary/20">
                        Fund Contract
                      </Button>
                    </motion.div>
                  )}

                  {/* Freelancer Acceptance */}
                  {state === 1 && isFreelancer && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <Button size="xl" loading={isPending} onClick={handleAcceptJob} className="px-10 shadow-glow-primary">
                        Accept Service Agreement
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Active Lifecycle Actions */}
                  {state === 2 && (
                    <div className="flex flex-wrap gap-3">
                      {isFreelancer && (
                        <Button size="lg" loading={isPending} onClick={handleSubmitMilestone} className="shadow-glow-primary">
                          <Upload className="mr-2 h-5 w-5" />
                          SubmitPhase {currentMilestone + 1}
                        </Button>
                      )}
                      {isClient && (
                        <>
                          <Button variant="secondary" size="lg" loading={isPending} onClick={handleApproveMilestone}>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Approve Work
                          </Button>
                          <Button size="lg" loading={isPending} onClick={handleReleasePayment} className="shadow-glow-secondary">
                            <DollarSign className="mr-2 h-5 w-5" />
                            Release Payment
                          </Button>
                        </>
                      )}
                      <Button variant="danger" size="lg" loading={isPending} onClick={handleRaiseDispute} className="bg-status-error/10 hover:bg-status-error/20 text-status-error border-status-error/20">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Dispute
                      </Button>
                    </div>
                  )}

                  {/* Completion / Dispute States */}
                  {state === 3 && (
                     <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-status-error/10 border border-status-error/20 text-status-error">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-widest">Arbitration Active</span>
                     </div>
                  )}
                  {state === 5 && (
                     <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-status-success/10 border border-status-success/20 text-status-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Protocol Finalized</span>
                     </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Roles & Info */}
        <div className="lg:col-span-1 space-y-8">
           {/* Parties Card */}
           <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col gap-6">
              <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] px-2 py-1 rounded bg-white/5 self-start">Entrusting Parties</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4 group/party">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover/party:scale-110 transition-transform">
                       <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">Client</p>
                       <p className="text-sm font-bold text-text-primary truncate">{client ? shortenAddress(client) : 'Not set'}</p>
                       {isClient && <Badge variant="info" className="mt-1 text-[8px] px-2">Account Principal</Badge>}
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group/party">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover/party:scale-110 transition-transform">
                       <Unlock className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">Freelancer</p>
                       <p className="text-sm font-bold text-text-primary truncate">{freelancer ? shortenAddress(freelancer) : 'Not set'}</p>
                       {isFreelancer && <Badge variant="info" className="mt-1 text-[8px] px-2">Service Provider</Badge>}
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* Technical Metadata */}
           <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col gap-6">
              <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] px-2 py-1 rounded bg-white/5 self-start">Smart Contract Info</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-text-dim">Asset</span>
                    <span className="text-text-primary font-bold">ETH (Native)</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-text-dim">Settlement Phase</span>
                    <span className="text-text-primary font-bold">{currentMilestone + 1} of {milestoneCount}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-text-dim text-xs">Agreement Hash</span>
                    <p className="text-xs font-mono text-text-dim/60 truncate italic">{jobMetadataHash || '0x...'}</p>
                 </div>
                 <Link to={`https://sepolia.etherscan.io/address/${address}`} target="_blank" className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/[0.06] transition-all">
                    Etherscan Explorer
                    <ExternalLink className="w-3.5 h-3.5" />
                 </Link>
              </div>
           </motion.div>
        </div>
      </div>
      
      {/* Informative Decorative Background */}
      <div className="fixed top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full translate-x-1/3 -z-10 pointer-events-none" />
    </motion.div>
  );
}

