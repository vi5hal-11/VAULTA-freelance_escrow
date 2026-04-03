import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  motion,
  AnimatePresence,
  useInView,
} from 'framer-motion';
import { Shield, Flag, Scale, ArrowRight, Zap, ChevronRight, Globe, Lock, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const ROLES = ['Freelancers', 'Developers', 'Designers', 'Protocols'];

const FEATURES = [
  {
    icon: Shield,
    title: 'Atomic Escrow',
    description:
      'Independently audited smart contracts ensuring funds are cryptographically secured.',
    gradient: 'from-primary to-accent-primary',
  },
  {
    icon: Cpu,
    title: 'Milestone Logic',
    description:
      'Programmable payouts triggered by verifiable work completion and approval.',
    gradient: 'from-secondary to-accent-secondary',
  },
  {
    icon: Scale,
    title: 'Neutral Arbitration',
    description:
      'Decentralized jury protocol for fair, incentive-aligned conflict resolution.',
    gradient: 'from-primary via-secondary to-accent-primary',
  },
];

const STATS = [
  { value: '24K+', label: 'Escrows Secured' },
  { value: '1.2B+', label: 'TVL Protected' },
  { value: '99.9%', label: 'Uptime' },
];

function FloatingOrb({
  color,
  size,
  initialX,
  initialY,
  delay = 0,
}: {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-[140px] opacity-20 pointer-events-none"
      style={{
        background: color,
        width: size,
        height: size,
      }}
      animate={{
        x: [initialX, initialX + 120, initialX - 80, initialX],
        y: [initialY, initialY - 100, initialY + 140, initialY],
        scale: [1, 1.2, 0.9, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [roleIndex, setRoleIndex] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-dark text-text-primary overflow-hidden font-sans">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <FloatingOrb
          color="hsla(var(--accent-primary), 0.5)"
          size={800}
          initialX={-200}
          initialY={-200}
        />
        <FloatingOrb
          color="hsla(var(--accent-secondary), 0.4)"
          size={700}
          initialX={600}
          initialY={100}
          delay={2}
        />
        <FloatingOrb
          color="hsla(var(--accent-primary), 0.3)"
          size={600}
          initialX={100}
          initialY={600}
          delay={5}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-text-primary">VAULTA</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
           {['Protocol', 'Ecosystem', 'Governance', 'Docs'].map((item) => (
             <a key={item} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-text-dim hover:text-primary transition-colors">{item}</a>
           ))}
        </div>

        <ConnectButton.Custom>
            {({ openConnectModal, account, mounted }) => {
              const connected = mounted && account;
              return (
                <Button 
                  onClick={connected ? () => navigate('/dashboard') : openConnectModal}
                  variant={connected ? 'primary' : 'outline'}
                  className="rounded-full px-8 font-black uppercase tracking-widest text-[10px]"
                >
                  {connected ? 'Dashboard' : 'Connect Wallet'}
                </Button>
              );
            }}
        </ConnectButton.Custom>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 flex flex-col items-center text-center">
        {/* Release Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-12"
        >
          <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsla(var(--accent-secondary)/1)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Mainnet V2.4 is Live</span>
          <ChevronRight className="w-3 h-3 text-text-dim" />
        </motion.div>

        {/* Hero Title */}
        <div className="max-w-5xl space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-text-primary"
          >
            Securing the <br /> 
            <span className="relative">
              Future for{' '}
              <span className="inline-block relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROLES[roleIndex]}
                    initial={{ opacity: 0, y: 40, rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -40, rotateX: -90 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent-primary bg-clip-text text-transparent italic"
                  >
                    {ROLES[roleIndex]}
                  </motion.span>
                </AnimatePresence>
                <span className="opacity-0">{ROLES[roleIndex]}</span>
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-text-muted font-medium max-w-2xl mx-auto leading-relaxed"
          >
            The institutional-grade escrow layer for the digital economy. 
            Automated milestone payments with decentralized justice.
          </motion.p>
        </div>

        {/* Hero Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 flex flex-col sm:flex-row items-center gap-6"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="group relative h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-glow-primary transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            Launch Terminal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="h-16 px-10 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-text-primary font-black uppercase tracking-[0.2em] text-xs hover:bg-white/[0.06] transition-all flex items-center gap-3">
            <Zap className="w-4 h-4 text-secondary" />
            Explore Docs
          </button>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-text-primary mb-4">{feature.title}</h3>
                <p className="text-text-muted font-medium leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-6 py-40 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center md:text-left space-y-2"
            >
              <p className="text-6xl md:text-7xl font-black text-text-primary tracking-tighter">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </p>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-text-dim">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-8 border-t border-white/5 bg-black/20 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-text-dim" />
             </div>
             <span className="text-lg font-black tracking-tighter">VAULTA</span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-colors">Discord</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-colors">GitHub</a>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">© 2026 Vaulta Protocols. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
