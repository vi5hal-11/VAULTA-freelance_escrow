import { useReadContract, useWriteContract } from 'wagmi';
import {
  FACTORY_ADDRESS,
  ESCROW_FACTORY_ABI,
  ARBITRATION_ADDRESS,
} from '@/lib/contracts';

export function useEscrowCount() {
  const { data: count, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: 'getEscrowCount',
  });

  return { count: count as bigint | undefined, isLoading };
}

export function useUserEscrows(userAddress: `0x${string}` | undefined) {
  const { data: escrows, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ESCROW_FACTORY_ABI,
    functionName: 'getUserEscrows',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    escrows: (escrows as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

export function useCreateEscrow() {
  const { writeContract, isPending, isSuccess, data: hash } = useWriteContract();

  const createEscrow = (
    freelancer: `0x${string}`,
    token: `0x${string}`,
    jobMetadataHash: string
  ) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: ESCROW_FACTORY_ABI,
      functionName: 'createEscrow',
      args: [freelancer, token, ARBITRATION_ADDRESS, jobMetadataHash],
    });
  };

  return { createEscrow, isPending, isSuccess, hash };
}
