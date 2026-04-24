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

  // Renamed from MIN_STAKE → minimumStake in the new contract
  const { data: minStake, isLoading: l2 } = useReadContract({
    ...contractBase,
    functionName: 'minimumStake',
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
  // Use the dedicated getJurorInfo view (returns stakedAmount, active)
  const { data, isLoading } = useReadContract({
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
    functionName: 'getJurorInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const juror = data as { stakedAmount: bigint; active: boolean } | [bigint, boolean] | undefined;

  // Support both object and tuple return shapes from wagmi
  const stakedAmount =
    juror && typeof juror === 'object' && !Array.isArray(juror)
      ? (juror as { stakedAmount: bigint }).stakedAmount
      : (juror as [bigint, boolean] | undefined)?.[0];

  const active =
    juror && typeof juror === 'object' && !Array.isArray(juror)
      ? (juror as { active: boolean }).active
      : (juror as [bigint, boolean] | undefined)?.[1];

  return {
    stake: stakedAmount,      // kept as `stake` for backwards compat with existing UI
    stakedAmount,
    active,
    isLoading,
  };
}

export function useDisputeInfo(disputeId: bigint | number | undefined) {
  const enabled = disputeId !== undefined && BigInt(disputeId ?? 0) > 0n;
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

  // getVotingStatus returns (uint8 clientVotes, uint8 freelancerVotes, bool resolved)
  const status = votingStatus as
    | { clientVotes: number; freelancerVotes: number; resolved: boolean }
    | [number, number, boolean]
    | undefined;

  const clientVotes = Array.isArray(status) ? status[0] : status?.clientVotes;
  const freelancerVotes = Array.isArray(status) ? status[1] : status?.freelancerVotes;
  const resolved = Array.isArray(status) ? status[2] : status?.resolved;

  return {
    // getJurors returns address[3] — cast to an array for iteration
    jurors: (jurors as `0x${string}`[] | undefined) ?? [],
    clientVotes,
    freelancerVotes,
    resolved,
    isLoading: l1 || l2,
  };
}

export function useDisputeEscrow(disputeId: bigint | number | undefined) {
  const enabled = disputeId !== undefined && BigInt(disputeId ?? 0) > 0n;
  const { data, isLoading } = useReadContract({
    address: ARBITRATION_ADDRESS,
    abi: ARBITRATION_ABI,
    functionName: 'getDisputeEscrow',
    args: enabled ? [BigInt(disputeId!)] : undefined,
    query: { enabled },
  });
  return { escrow: data as `0x${string}` | undefined, isLoading };
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

  const withdrawStake = () => {
    writeContract({
      address: ARBITRATION_ADDRESS,
      abi: ARBITRATION_ABI,
      functionName: 'withdrawStake',
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

  return { actions: { stake, withdrawStake, vote }, isPending, hash };
}
