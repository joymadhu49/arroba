"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { handleRegistryAbi } from "@/lib/abi";
import { REGISTRY_ADDRESS } from "@/lib/contracts";

/**
 * The connected wallet's registered handle + verification status.
 */
export function useMyHandle() {
  const { address, isConnected } = useAccount();

  const handleQuery = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: handleRegistryAbi,
    functionName: "handleOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && REGISTRY_ADDRESS) },
  });

  const handle = handleQuery.data ?? "";
  const isRegistered = handle.length > 0;

  const verifiedQuery = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: handleRegistryAbi,
    functionName: "isVerified",
    args: isRegistered ? [handle] : undefined,
    query: { enabled: Boolean(isRegistered && REGISTRY_ADDRESS) },
  });

  const refetchHandle = handleQuery.refetch;
  const refetchVerified = verifiedQuery.refetch;
  const refetch = useCallback(() => {
    refetchHandle();
    refetchVerified();
  }, [refetchHandle, refetchVerified]);

  return {
    address,
    isConnected,
    handle,
    isRegistered,
    isVerified: verifiedQuery.data ?? false,
    isLoading: handleQuery.isLoading || verifiedQuery.isLoading,
    refetch,
  };
}
