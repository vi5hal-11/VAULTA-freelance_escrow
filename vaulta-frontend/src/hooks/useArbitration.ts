import { useReadContract, useWriteContract } from 'wagmi';
import { ARBITRATION_ADDRESS, ARBITRATION_ABI } from '@/lib/contracts';

export function useArbitrationData() {
  const contractBase = {
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
  } as const;

  const { data: disputeCount, isLoading: l1 } = useReadContract({
    ...contractBase,
    functionName: 'disputeCount',
  });

  const { data: minStake, isLoading: l2 } = useReadContract({
    ...contractBase,
    functionName: 'MIN_STAKE',
  });

  const { data: jurorsPerDispute, isLoading: l3 } = useReadContract({
    ...contractBase,
    functionName: 'JURORS_PER_DISPUTE',
  });

  return {
    disputeCount: disputeCount as bigint | undefined,
    minStake: minStake as bigint | undefined,
    jurorsPerDispute: jurorsPerDispute as bigint | undefined,
    isLoading: l1 || l2 || l3,
  };
}

export function useJurorStatus(address: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
    functionName: 'jurors',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const juror = data as [bigint, boolean] | undefined;

  return {
    stake: juror?.[0],
    active: juror?.[1],
    isLoading,
  };
}

export function useDisputeInfo(disputeId: bigint | number | undefined) {
  const enabled = disputeId !== undefined;
  const args = enabled ? [BigInt(disputeId!)] as const : undefined;

  const { data: jurors, isLoading: l1 } = useReadContract({
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
    functionName: 'getJurors',
    args,
    query: { enabled },
  });

  const { data: votingStatus, isLoading: l2 } = useReadContract({
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
    functionName: 'getVotingStatus',
    args,
    query: { enabled },
  });

  const status = votingStatus as [bigint, bigint, boolean] | undefined;

  return {
    jurors: (jurors as `0x${string}`[] | undefined) ?? [],
    clientVotes: status?.[0],
    freelancerVotes: status?.[1],
    resolved: status?.[2],
    isLoading: l1 || l2,
  };
}

export function useArbitrationActions() {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const stake = (valueInWei: bigint) => {
    writeContract({
      address: ARBITRATION_ADDRESS,
      abi: ARBITRATION_ABI,
      functionName: 'stake',
      value: valueInWei,
    });
  };

  const vote = (disputeId: bigint | number, decision: number) => {
    writeContract({
      address: ARBITRATION_ADDRESS,
      abi: ARBITRATION_ABI,
      functionName: 'vote',
      args: [BigInt(disputeId), decision],
    });
  };

  return { actions: { stake, vote }, isPending, hash };
}
