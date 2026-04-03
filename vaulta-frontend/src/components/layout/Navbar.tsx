import { Menu } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { useStore } from '@/store/useStore';

interface NavbarProps {
  title: string;
}

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  5: 'Goerli',
  11155111: 'Sepolia',
  137: 'Polygon',
  80001: 'Mumbai',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  31337: 'Localhost',
};

export default function Navbar({ title }: NavbarProps) {
  const { setSidebarOpen } = useStore();
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const chainName = chainId ? (chainNames[chainId] ?? `Chain ${chainId}`) : 'Unknown';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-surface/60 backdrop-blur-xl border-b border-white/10">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <Menu className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-lg font-semibold text-white tracking-wide">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Network indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'
            }`}
          />
          <span className="text-xs text-white/60 font-medium">
            {isConnected ? chainName : 'Disconnected'}
          </span>
        </div>

        {/* RainbowKit connect */}
        <ConnectButton
          chainStatus="icon"
          accountStatus="avatar"
          showBalance={false}
        />
      </div>
    </header>
  );
}
