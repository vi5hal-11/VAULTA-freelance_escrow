import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Flag,
  Rocket,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateEscrow } from '@/hooks/useEscrowFactory';
import { useStore } from '@/store/useStore';
import { ESCROW_ABI, FACTORY_ADDRESS } from '@/lib/contracts';
import { cn } from '@/lib/utils';

interface Milestone {
  name: string;
  amount: string;
}

const STEPS = [
  { label: 'Project Info', icon: Briefcase, description: 'Basic agreement details' },
  { label: 'Milestones', icon: Flag, description: 'Payment schedule' },
  { label: 'Finalize', icon: Rocket, description: 'Review & deploy' },
];

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    filter: 'blur(10px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    filter: 'blur(10px)',
  }),
};

export default function CreateEscrow() {
  const navigate = useNavigate();
  const { addToast } = useStore();
  const { createEscrow, isPending: isCreating, hash: createHash } = useCreateEscrow();
  const { writeContract: writeMilestones, isPending: isAddingMilestones, isSuccess: milestonesSuccess } = useWriteContract();
  const isPending = isCreating || isAddingMilestones;

  // Wait for the createEscrow tx to be mined so we can parse the new escrow address
  const { data: receipt } = useWaitForTransactionReceipt({ hash: createHash });

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [newEscrowAddress, setNewEscrowAddress] = useState<`0x${string}` | null>(null);

  // Step 1
  const [projectTitle, setProjectTitle] = useState('');
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState(
    '0x0000000000000000000000000000000000000000'
  );
  const [jobMetadataHash, setJobMetadataHash] = useState('');

  // Step 2
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: '', amount: '' },
  ]);

  // Validation
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const step1Valid =
    projectTitle.trim().length > 0 && isValidAddress(freelancerAddress);

  const step2Valid =
    milestones.length >= 1 &&
    milestones.every((m) => m.name.trim().length > 0 && parseFloat(m.amount) > 0);

  const totalAmount = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const goNext = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 2));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const addMilestone = () => {
    setMilestones((prev) => [...prev, { name: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (
    index: number,
    field: keyof Milestone,
    value: string
  ) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleDeploy = () => {
    addToast({ type: 'pending', message: 'Initiating deployment...' });
    createEscrow(
      freelancerAddress as `0x${string}`,
      tokenAddress as `0x${string}`,
      jobMetadataHash || projectTitle
    );
  };

  // Phase 1: when createEscrow tx is mined, extract new escrow address and call addMilestones
  useEffect(() => {
    if (!receipt) return;
    // EscrowCreated(address indexed escrow, ...) — escrow address is topics[1]
    const log = receipt.logs.find(
      (l) => l.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase()
    );
    if (!log || !log.topics[1]) return;
    const escrow = `0x${log.topics[1].slice(26)}` as `0x${string}`;
    setNewEscrowAddress(escrow);
    addToast({ type: 'pending', message: 'Adding milestones on-chain...' });
    const amounts = milestones.map((m) => parseEther(m.amount));
    const hashes = milestones.map((m) => m.name);
    writeMilestones({
      address: escrow,
      abi: ESCROW_ABI,
      functionName: 'addMilestones',
      args: [amounts, hashes],
    });
  }, [receipt]);

  // Phase 2: milestones added — navigate away
  useEffect(() => {
    if (milestonesSuccess) {
      addToast({ type: 'success', message: 'Escrow contract deployed successfully!' });
      navigate('/escrows');
    }
  }, [milestonesSuccess, addToast, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      {/* Page Header */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-2"
        >
          <Sparkles className="w-3 h-3" />
          Smart Contract Factory
        </motion.div>
        <h1 className="text-5xl font-black text-text-primary tracking-tight">
          Launch New Escrow<span className="text-primary.">.</span>
        </h1>
        <p className="text-text-muted font-medium max-w-lg mx-auto">
          Deploy a secure, milestone-based smart contract to manage your freelance engagement with zero trust required.
        </p>
      </div>

      {/* Stepper with Premium Glassmorphism */}
      <div className="relative glass-card p-4 rounded-3xl flex items-center justify-between gap-2 max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex-1 flex items-center group">
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500">
                <div className={cn(
                  "relative h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center transition-all duration-500 ring-offset-2 ring-offset-background",
                  isCompleted ? "bg-status-success text-white" : 
                  isCurrent ? "bg-primary text-white shadow-glow-primary ring-2 ring-primary/50" : 
                  "bg-white/5 text-text-dim"
                )}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  {isCurrent && (
                    <motion.div 
                      layoutId="stepper-active"
                      className="absolute inset-0 rounded-xl bg-primary -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                    isCurrent || isCompleted ? "text-text-primary" : "text-text-dim"
                  )}>{step.label}</p>
                  <p className="text-[9px] font-medium text-text-muted/60 whitespace-nowrap">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-white/5 mx-2 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content Card */}
      <Card className="glass-card-hover p-10 relative overflow-hidden min-h-[500px]">
        {/* Background glow specific to step */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 0 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-8 relative z-10"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">Project Parameters</h2>
                <p className="text-sm text-text-muted font-medium">Define the core identity and entity addresses for this contract.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Contract Name / Service Title"
                  placeholder="e.g. Protocol High-Fidelity Design"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  description="This name will be stored on-chain."
                  required
                />
                <Input
                  label="Freelancer Wallet (Recipient)"
                  placeholder="0x..."
                  value={freelancerAddress}
                  onChange={(e) => setFreelancerAddress(e.target.value)}
                  error={freelancerAddress && !isValidAddress(freelancerAddress) ? 'Invalid Ethereum address' : undefined}
                  description="The address that will receive the funds."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Settlement Currency"
                  placeholder="0x0...0 for Native ETH"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  description="ERC-20 token address or empty for ETH."
                />
                <Input
                  label="Job Specification (IPFS)"
                  placeholder="Qm... or JSON string"
                  value={jobMetadataHash}
                  onChange={(e) => setJobMetadataHash(e.target.value)}
                  description="Optional metadata or requirements hash."
                />
              </div>

              <div className="flex justify-end pt-8 border-t border-white/5">
                <Button
                  variant="primary"
                  size="xl"
                  disabled={!step1Valid}
                  onClick={goNext}
                  className="px-10"
                >
                  Continue to Milestones
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-8 relative z-10"
            >
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text-primary tracking-tight">Payment Milestones</h2>
                  <p className="text-sm text-text-muted font-medium">Divide the project into verifiable deliverables.</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addMilestone}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Milestone
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {milestones.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 ring-1 ring-transparent hover:ring-white/10 hover:bg-white/[0.04] transition-all duration-300"
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 text-xs font-bold text-text-dim border border-white/5 flex-shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-4">
                        <Input
                          placeholder="Deliverable description (e.g. Final Review)"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Value (ETH)"
                          type="number"
                          step="0.01"
                          min="0"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        />
                      </div>
                      {milestones.length > 1 && (
                        <button
                          onClick={() => removeMilestone(index)}
                          className="mt-2 p-2 rounded-xl text-text-dim hover:text-status-error hover:bg-status-error/10 transition-all duration-200"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-1">Project Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-text-primary">{totalAmount.toFixed(4)}</span>
                    <span className="text-sm font-bold text-primary">ETH</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Button variant="ghost" size="lg" onClick={goBack} className="flex-1 sm:flex-initial">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="xl"
                    disabled={!step2Valid}
                    onClick={goNext}
                    className="flex-1 sm:flex-initial px-10 shadow-glow-primary"
                  >
                    Review Deployment
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-8 relative z-10"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">Contract Verification</h2>
                <p className="text-sm text-text-muted font-medium">Verify the immutable parameters before network execution.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-card bg-white/[0.01] divide-y divide-white/5 rounded-3xl p-2">
                    {[
                      { label: 'Agreement', value: projectTitle },
                      { label: 'Recipient', value: `${freelancerAddress.slice(0, 10)}...${freelancerAddress.slice(-8)}`, mono: true },
                      { label: 'Settlement', value: tokenAddress.startsWith('0x0000') ? 'Native Ethereum (ETH)' : 'ERC-20 Protocol' },
                    ].map((item, i) => (
                      <div key={i} className="px-6 py-5 flex justify-between items-center group/review">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-dim group-hover/review:text-text-muted transition-colors">{item.label}</span>
                        <span className={cn(
                          "text-sm font-bold text-text-primary",
                          item.mono && "font-mono text-xs opacity-80"
                        )}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      By deploying, you are seeding the <span className="text-text-primary font-bold">Escrow Factory</span> with these parameters. You will need to fund the contract in the next step to activate it.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 glass-card bg-primary/[0.03] p-8 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Payment Schedule</h3>
                    <div className="space-y-4">
                      {milestones.map((m, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-text-dim">{i+1}</span>
                            <span className="text-xs font-semibold text-text-muted truncate max-w-[120px]">{m.name}</span>
                          </div>
                          <span className="text-xs font-bold text-text-primary">{parseFloat(m.amount).toFixed(3)} ETH</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-2">Total Commitment</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-text-primary tracking-tighter">{totalAmount.toFixed(4)}</span>
                       <span className="text-sm font-bold text-primary">ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-white/5">
                <Button variant="ghost" size="lg" onClick={goBack}>
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Modify Plan
                </Button>
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    size="xl"
                    loading={isPending}
                    disabled={isPending}
                    onClick={handleDeploy}
                    className="px-12 shadow-glow-primary"
                  >
                    {isAddingMilestones ? 'Adding Milestones...' : isCreating ? 'Deploying...' : 'Deploy Contract'}
                    {!isPending && <ArrowRight className="h-5 w-5 ml-2" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {/* Decorative floating elements */}
      <div className="fixed top-1/4 left-10 w-32 h-32 bg-primary/5 blur-[80px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 right-10 w-40 h-40 bg-secondary/5 blur-[90px] rounded-full animate-pulse pointer-events-none" />
    </motion.div>
  );
}

