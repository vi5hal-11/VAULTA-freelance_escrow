import { useState } from 'react';
import { useAccount, useBalance, useChainId, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Copy,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  CheckCircle,
  TrendingUp,
  X,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { useUserEscrows } from '@/hooks/useEscrowFactory';
import { useJurorStatus } from '@/hooks/useArbitration';
import { formatEth, getExplorerUrl, cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
} as const;

export default function Wallet() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const addToast = useStore((s) => s.addToast);
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);

  // Send modal state
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // Receive modal state
  const [showReceive, setShowReceive] = useState(false);

  const { sendTransaction, isPending: isSending } = useSendTransaction();

  const { escrows } = useUserEscrows(address);
  const { stake: jurorStake } = useJurorStatus(address);

  const explorerUrl = address ? getExplorerUrl(chainId, address) : null;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      addToast({ type: 'success', message: 'Address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    if (!sendTo || !sendAmount) return;
    sendTransaction(
      { to: sendTo as `0x${string}`, value: parseEther(sendAmount) },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `Sent ${sendAmount} ETH` });
          setShowSend(false);
          setSendTo('');
          setSendAmount('');
        },
        onError: (e) => addToast({ type: 'error', message: e.message }),
      }
    );
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
            Connect a Web3 wallet to view your balances and escrow positions.
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
                <Button
                  variant="primary"
                  onClick={() => setShowSend(true)}
                  className="shadow-glow-primary font-black uppercase text-[10px] tracking-widest h-12 px-6"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Send
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReceive(true)}
                  className="font-black uppercase text-[10px] tracking-widest h-12 px-6"
                >
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
              {explorerUrl ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-xs font-bold text-text-muted"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Explorer
                </a>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-bold text-text-dim">
                  Local Network
                </span>
              )}
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

      {/* Transaction History — replaced mock with on-chain prompt */}
      <motion.div variants={itemVariants}>
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-text-primary tracking-tight">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-text-dim" />
            </div>
            <p className="text-sm font-bold text-text-muted">Live transaction history coming soon.</p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
              >
                View all transactions on Block Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Send Modal ── */}
      <AnimatePresence>
        {showSend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowSend(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-white/10 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-text-primary">Send ETH</h2>
                <button onClick={() => setShowSend(false)} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                  <X className="w-5 h-5 text-text-dim" />
                </button>
              </div>
              <Input
                label="Recipient Address"
                placeholder="0x..."
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
              />
              <Input
                label="Amount (ETH)"
                type="number"
                placeholder="0.00"
                step="0.001"
                min="0"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowSend(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  className="flex-1 shadow-glow-primary"
                  loading={isSending}
                  disabled={!sendTo || !sendAmount || isSending}
                  onClick={handleSend}
                >
                  Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Receive Modal ── */}
      <AnimatePresence>
        {showReceive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowReceive(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-white/10 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-text-primary">Receive ETH</h2>
                <button onClick={() => setShowReceive(false)} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                  <X className="w-5 h-5 text-text-dim" />
                </button>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-3">Your Address</p>
                <p className="font-mono text-sm text-text-primary break-all">{address}</p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => { copyAddress(); setShowReceive(false); }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-1/3 -left-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-1/3 -right-20 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </motion.div>
  );
}
