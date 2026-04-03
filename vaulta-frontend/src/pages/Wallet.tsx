import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Copy,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { useUserEscrows } from '@/hooks/useEscrowFactory';
import { useJurorStatus } from '@/hooks/useArbitration';
import { formatEth, cn } from '@/lib/utils';

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

const MOCK_TRANSACTIONS = [
  { type: 'out', label: 'Fund Escrow #12', amount: '2.5 ETH', time: '2 hours ago', status: 'confirmed' },
  { type: 'in', label: 'Milestone Release', amount: '1.0 ETH', time: '1 day ago', status: 'confirmed' },
  { type: 'out', label: 'Juror Stake', amount: '0.15 ETH', time: '3 days ago', status: 'confirmed' },
  { type: 'in', label: 'Dispute Reward', amount: '0.08 ETH', time: '5 days ago', status: 'confirmed' },
  { type: 'out', label: 'Fund Escrow #9', amount: '5.0 ETH', time: '1 week ago', status: 'confirmed' },
];

export default function Wallet() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const addToast = useStore((s) => s.addToast);
  const [copied, setCopied] = useState(false);

  const { escrows } = useUserEscrows(address);
  const { stake: jurorStake } = useJurorStatus(address);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      addToast({ type: 'success', message: 'Address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <WalletIcon className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Connect Your Wallet</h2>
          <p className="text-text-muted font-medium max-w-md">
            Connect a Web3 wallet to view your balances, transaction history, and escrow positions.
          </p>
        </div>
        <ConnectButton />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            Secure Vault
          </div>
          <h1 className="text-5xl font-black text-text-primary tracking-tight">Wallet Overview</h1>
          <p className="text-text-muted font-medium max-w-xl">
            Manage your assets, monitor escrow positions, and track on-chain activity.
          </p>
        </div>
      </motion.div>

      {/* Balance & Address Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Balance */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Total Balance</p>
                <p className="text-5xl font-black text-text-primary tracking-tight">
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)}` : '0.0000'}
                  <span className="text-2xl text-text-muted ml-2">{balance?.symbol || 'ETH'}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="primary" className="shadow-glow-primary font-black uppercase text-[10px] tracking-widest h-12 px-6">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Send
                </Button>
                <Button variant="outline" className="font-black uppercase text-[10px] tracking-widest h-12 px-6">
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Receive
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Address Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-8 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Connected Address</p>
              <p className="font-mono text-sm text-text-primary font-bold break-all">{address}</p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-xs font-bold text-text-muted"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-xs font-bold text-text-muted"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Explorer
              </a>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <Badge variant="success" className="text-[9px] font-black uppercase">Active</Badge>
          </div>
          <p className="text-2xl font-black text-text-primary">{escrows.length}</p>
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">My Escrows</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <Shield className="w-5 h-5" />
            </div>
            <Badge variant="info" className="text-[9px] font-black uppercase">Staked</Badge>
          </div>
          <p className="text-2xl font-black text-text-primary">
            {jurorStake !== undefined ? `${formatEth(jurorStake)} ETH` : '0 ETH'}
          </p>
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">Juror Stake</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <Badge variant="success" className="text-[9px] font-black uppercase">On-chain</Badge>
          </div>
          <p className="text-2xl font-black text-text-primary">{escrows.length}</p>
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">Total Contracts</p>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants}>
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-text-primary tracking-tight">Recent Activity</h3>
            <Badge variant="default" className="text-[10px] uppercase font-black tracking-widest">Last 30 Days</Badge>
          </div>

          <div className="space-y-4">
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    tx.type === 'in'
                      ? "bg-green-500/10 border border-green-500/20 text-green-500"
                      : "bg-primary/10 border border-primary/20 text-primary"
                  )}>
                    {tx.type === 'in' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{tx.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-text-dim" />
                      <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{tx.time}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-black font-mono",
                    tx.type === 'in' ? "text-green-500" : "text-text-primary"
                  )}>
                    {tx.type === 'in' ? '+' : '-'}{tx.amount}
                  </p>
                  <Badge variant="success" className="text-[8px] font-black uppercase mt-1">{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Decorative Elements */}
      <div className="fixed top-1/3 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/3 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
