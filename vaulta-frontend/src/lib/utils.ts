import { formatEther } from 'viem';

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEth(value: bigint): string {
  const formatted = formatEther(value);
  const num = parseFloat(formatted);
  return num.toFixed(4);
}

export function getStateLabel(state: number): string {
  const labels: Record<number, string> = {
    0: 'Created',
    1: 'Funded',
    2: 'Accepted',
    3: 'Disputed',
    4: 'Resolved',
    5: 'Completed',
  };
  return labels[state] ?? 'Unknown';
}

export function getStateColor(state: number): string {
  const colors: Record<number, string> = {
    0: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    2: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
    3: 'text-red-400 bg-red-400/10 border-red-400/20',
    4: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    5: 'text-green-400 bg-green-400/10 border-green-400/20',
  };
  return colors[state] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20';
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
