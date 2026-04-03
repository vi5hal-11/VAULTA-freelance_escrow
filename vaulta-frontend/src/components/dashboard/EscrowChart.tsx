import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  volume: number;
  contracts: number;
}

interface EscrowChartProps {
  data: ChartDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card bg-background/80 backdrop-blur-xl px-4 py-3 shadow-2xl border-white/10 ring-1 ring-white/5">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-muted capitalize">{entry.dataKey}:</span>
            </div>
            <span className="text-text-primary">
              {entry.dataKey === 'volume'
                ? `$${entry.value.toLocaleString()}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EscrowChart({ data }: EscrowChartProps) {
  return (
    <div className="glass-card p-6 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.25em]">
            Escrow Analytics
          </h3>
          <p className="text-xs text-text-dim mt-1 font-medium italic">Standard escrow growth performance</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--accent-primary)/0.5)]" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--accent-secondary)/0.5)]" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Contracts</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent-primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--accent-primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="contractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent-secondary))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--accent-secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="hsla(var(--text-dim) / 0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--text-dim))', fontSize: 10, fontWeight: 700 }}
              dy={12}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--text-dim))', fontSize: 10, fontWeight: 700 }}
              width={60}
            />

            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'hsla(var(--text-dim) / 0.1)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="volume"
              stroke="hsl(var(--accent-primary))"
              strokeWidth={3}
              fill="url(#volumeGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
              activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--accent-primary))' }}
            />

            <Area
              type="monotone"
              dataKey="contracts"
              stroke="hsl(var(--accent-secondary))"
              strokeWidth={3}
              fill="url(#contractsGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
              activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--accent-secondary))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

