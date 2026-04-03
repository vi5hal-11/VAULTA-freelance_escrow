import { useReadContract, useWriteContract } from 'wagmi';
import { ESCROW_ABI } from '@/lib/contracts';

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

  const { data: state, isLoading: l3 } = useReadContract({
    ...contractBase,
    functionName: 'state',
  });

  const { data: totalAmount, isLoading: l4 } = useReadContract({
    ...contractBase,
    functionName: 'totalAmount',
  });

  const { data: currentMilestone, isLoading: l5 } = useReadContract({
    ...contractBase,
    functionName: 'currentMilestone',
  });

  const { data: milestoneCount, isLoading: l6 } = useReadContract({
    ...contractBase,
    functionName: 'getMilestoneCount',
  });

  const { data: jobMetadataHash, isLoading: l7 } = useReadContract({
    ...contractBase,
    functionName: 'jobMetadataHash',
  });

  const { data: token, isLoading: l8 } = useReadContract({
    ...contractBase,
    functionName: 'token',
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

  return {
    client: client as `0x${string}` | undefined,
    freelancer: freelancer as `0x${string}` | undefined,
    state: state as number | undefined,
    totalAmount: totalAmount as bigint | undefined,
    currentMilestone: currentMilestone as bigint | undefined,
    milestoneCount: milestoneCount as bigint | undefined,
    jobMetadataHash: jobMetadataHash as string | undefined,
    token: token as `0x${string}` | undefined,
    isLoading,
  };
}

export function useMilestone(
  escrowAddress: `0x${string}` | undefined,
  index: bigint | number
) {
  const { data, isLoading } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: 'milestones',
    args: [BigInt(index)],
    query: {
      enabled: !!escrowAddress,
    },
  });

  const milestone = data as
    | [bigint, boolean, boolean, boolean, string]
    | undefined;

  return {
    amount: milestone?.[0],
    submitted: milestone?.[1],
    approved: milestone?.[2],
    paid: milestone?.[3],
    metadataHash: milestone?.[4],
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

  const addMilestones = (amounts: bigint[], metadataHashes: string[]) => {
    writeContract({
      ...contractBase,
      functionName: 'addMilestones',
      args: [amounts, metadataHashes],
    });
  };

  const acceptJob = () => {
    writeContract({
      ...contractBase,
      functionName: 'acceptJob',
    });
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

  const raiseDispute = (disputeId: bigint | number) => {
    writeContract({
      ...contractBase,
      functionName: 'raiseDispute',
      args: [BigInt(disputeId)],
    });
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
