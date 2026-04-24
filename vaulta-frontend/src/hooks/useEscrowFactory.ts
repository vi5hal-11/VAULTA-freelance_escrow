import { useReadContract, useWriteContract } from 'wagmi';
import { FACTORY_ADDRESS, ESCROW_FACTORY_ABI } from '@/lib/contracts';
import { toBytes32 } from '@/lib/utils';

export function useEscrowCount() {
  const { data: count, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: 'getEscrowCount',
  });

  return { count: count as bigint | undefined, isLoading };
}

/**
 * Returns all escrows where the user is the client.
 */
export function useClientEscrows(userAddress: `0x${string}` | undefined) {
  const { data: escrows, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: 'getClientEscrows',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  return {
    escrows: (escrows as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

/**
 * Returns all escrows where the user is the freelancer.
 */
export function useFreelancerEscrows(userAddress: `0x${string}` | undefined) {
  const { data: escrows, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: 'getFreelancerEscrows',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  return {
    escrows: (escrows as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

/**
 * Returns the combined deduplicated list of all escrows a user is party to,
 * plus separate role-based lists. Replaces the old useUserEscrows hook.
 */
export function useUserEscrows(userAddress: `0x${string}` | undefined) {
  const { escrows: asClient, isLoading: l1, refetch: r1 } = useClientEscrows(userAddress);
  const { escrows: asFreelancer, isLoading: l2, refetch: r2 } = useFreelancerEscrows(userAddress);

  // Merge and deduplicate
  const allEscrows = Array.from(
    new Set([...asClient, ...asFreelancer])
  ) as `0x${string}`[];

  return {
    escrows: allEscrows,
    asClient,
    asFreelancer,
    isLoading: l1 || l2,
    refetch: () => { r1(); r2(); },
  };
}

export function useCreateEscrow() {
  const { writeContract, isPending, isSuccess, data: hash } = useWriteContract();

  /**
   * @param freelancer  Freelancer wallet address
   * @param token       ERC-20 token address, or `0x000...0` for native ETH
   * @param jobMetadata Human-readable job title / IPFS hash (auto-encoded to bytes32)
   */
  const createEscrow = (
    freelancer: `0x${string}`,
    token: `0x${string}`,
    jobMetadata: string
  ) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: ESCROW_FACTORY_ABI,
      functionName: 'createEscrow',
      args: [freelancer, token, toBytes32(jobMetadata)],
    });
  };

  return { createEscrow, isPending, isSuccess, hash };
}
