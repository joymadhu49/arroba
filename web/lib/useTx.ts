"use client";

import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

/**
 * Small wrapper around useWriteContract + useWaitForTransactionReceipt with a
 * one-shot onConfirmed callback (used to refetch reads after a tx settles).
 */
export function useTx(onConfirmed?: () => void) {
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const notifiedFor = useRef<string | undefined>(undefined);
  const callbackRef = useRef(onConfirmed);
  useEffect(() => {
    callbackRef.current = onConfirmed;
  }, [onConfirmed]);

  useEffect(() => {
    if (isSuccess && hash && notifiedFor.current !== hash) {
      notifiedFor.current = hash;
      callbackRef.current?.();
    }
  }, [isSuccess, hash]);

  return {
    writeContract,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError ?? receiptError ?? null,
    reset,
  };
}
