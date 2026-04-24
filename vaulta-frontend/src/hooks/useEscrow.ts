import { useReadContract, useWriteContract } from 'wagmi';
import { ESCROW_ABI } from '@/lib/contracts';
import { fromBytes32, toBytes32 } from '@/lib/utils';

export function useEscrowData(address: `0x${string}` | undefined) {
  const enabled = !!address;
  const contractBase = { address, abi: ESCROW_ABI, query: { enabled } } as const;

  const { data: client, isLoading: l1 } = useReadContract({
    ...contractBase,
    functionName: 'client',
  });

  const { data: freelancer, isLoading: l2 } = useReadContract({
    ...contractBase,
    functionName: 'freelancer',
  });

  // New contract uses `status` (was `state`)
  const { data: status, isLoading: l3 } = useReadContract({
    ...contractBase,
    functionName: 'status',
  });

  const { data: totalAmount, isLoading: l4 } = useReadContract({
    ...contractBase,
    functionName: 'totalAmount',
  });

  const { data: milestoneCount, isLoading: l5 } = useReadContract({
    ...contractBase,
    functionName: 'getMilestoneCount',
  });

  // jobMetadataHash is bytes32 on-chain; decode to string for display
  const { data: rawJobMetadataHash, isLoading: l6 } = useReadContract({
    ...contractBase,
    functionName: 'jobMetadataHash',
  });

  const { data: token, isLoading: l7 } = useReadContract({
    ...contractBase,
    functionName: 'token',
  });

  const { data: releasedAmount, isLoading: l8 } = useReadContract({
    ...contractBase,
    functionName: 'releasedAmount',
  });

  // New: renamed from `arbitration` to `arbitrationContract`
  const { data: arbitrationContract, isLoading: l9 } = useReadContract({
    ...contractBase,
    functionName: 'arbitrationContract',
  });

  const { data: disputeId, isLoading: l10 } = useReadContract({
    ...contractBase,
    functionName: 'disputeId',
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10;

  return {
    client: client as `0x${string}` | undefined,
    freelancer: freelancer as `0x${string}` | undefined,
    // Expose as both `status` (new name) and `state` (backwards compat for existing components)
    status: status as number | undefined,
    state: status as number | undefined,
    totalAmount: totalAmount as bigint | undefined,
    releasedAmount: releasedAmount as bigint | undefined,
    milestoneCount: milestoneCount as bigint | undefined,
    // Decode bytes32 → human-readable string
    jobMetadataHash: rawJobMetadataHash
      ? fromBytes32(rawJobMetadataHash as `0x${string}`)
      : undefined,
    token: token as `0x${string}` | undefined,
    arbitrationContract: arbitrationContract as `0x${string}` | undefined,
    disputeId: disputeId as bigint | undefined,
    isLoading,
  };
}

export function useMilestone(
  escrowAddress: `0x${string}` | undefined,
  index: bigint | number
) {
  // Use getMilestone (tuple return) instead of the raw milestones() mapping
  const { data, isLoading } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: 'getMilestone',
    args: [BigInt(index)],
    query: { enabled: !!escrowAddress },
  });

  const milestone = data as
    | { amount: bigint; metadataHash: `0x${string}`; submitted: boolean; approved: boolean; paid: boolean }
    | undefined;

  return {
    amount: milestone?.amount,
    submitted: milestone?.submitted,
    approved: milestone?.approved,
    paid: milestone?.paid,
    // Decode bytes32 → string for display
    metadataHash: milestone?.metadataHash
      ? fromBytes32(milestone.metadataHash)
      : undefined,
    isLoading,
  };
}

export function useEscrowActions(escrowAddress: `0x${string}` | undefined) {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const contractBase = { address: escrowAddress!, abi: ESCROW_ABI } as const;

  const fundEscrow = (valueInWei: bigint) => {
    writeContract({
      ...contractBase,
      functionName: 'fundEscrow',
      value: valueInWei,
    });
  };

  const addMilestones = (amounts: bigint[], metadataStrings: string[]) => {
    // Convert string labels → bytes32 for the contract
    const hashes = metadataStrings.map((s) => toBytes32(s)) as readonly `0x${string}`[];
    writeContract({
      ...contractBase,
      functionName: 'addMilestones',
      args: [amounts, hashes],
    });
  };

  const acceptJob = () => {
    writeContract({ ...contractBase, functionName: 'acceptJob' });
  };

  const submitMilestone = (index: bigint | number) => {
    writeContract({
      ...contractBase,
      functionName: 'submitMilestone',
      args: [BigInt(index)],
    });
  };

  const approveMilestone = (index: bigint | number) => {
    writeContract({
      ...contractBase,
      functionName: 'approveMilestone',
      args: [BigInt(index)],
    });
  };

  const releaseMilestonePayment = (index: bigint | number) => {
    writeContract({
      ...contractBase,
      functionName: 'releaseMilestonePayment',
      args: [BigInt(index)],
    });
  };

  // New contract: raiseDispute() takes NO arguments
  const raiseDispute = () => {
    writeContract({ ...contractBase, functionName: 'raiseDispute' });
  };

  return {
    actions: {
      fundEscrow,
      addMilestones,
      acceptJob,
      submitMilestone,
      approveMilestone,
      releaseMilestonePayment,
      raiseDispute,
    },
    isPending,
    hash,
  };
}
