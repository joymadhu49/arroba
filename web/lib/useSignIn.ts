"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

const keyFor = (address: string) => `arroba.signin.${address.toLowerCase()}`;

/**
 * Post-connect sign-in: the user proves control of the connected wallet with
 * a free message signature before the app unlocks. The signature is kept in
 * sessionStorage per address, so every new browser session asks again —
 * connecting is always explicit, never silent.
 */
export function useSignIn() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set, not a single value: extensions can flap accounts A→B→A and a
  // last-address-only guard would re-prompt on every round trip.
  const promptedFor = useRef<Set<string>>(new Set());

  // Restore this address's sign-in for the current browser session.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is unavailable during SSR; must read after mount
    setSignedIn(address ? Boolean(sessionStorage.getItem(keyFor(address))) : false);
    setError(null);
  }, [address]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setError(null);
    try {
      const signature = await signMessageAsync({
        message:
          `Arroba sign-in\n\n` +
          `Wallet: ${address}\n\n` +
          `This free signature proves you control this wallet. ` +
          `It is not a transaction and authorizes nothing else.`,
      });
      sessionStorage.setItem(keyFor(address), signature);
      setSignedIn(true);
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e?.shortMessage ?? e?.message ?? "Signature rejected.");
    }
  }, [address, signMessageAsync]);

  // Prompt automatically once per address right after connecting; rejections
  // surface a manual retry button instead of re-prompting in a loop.
  useEffect(() => {
    if (!isConnected || !address || signedIn || isPending) return;
    if (promptedFor.current.has(address)) return;
    promptedFor.current.add(address);
    void signIn();
  }, [isConnected, address, signedIn, isPending, signIn]);

  return {
    needsSignature: Boolean(isConnected && address && !signedIn),
    signedIn,
    signIn,
    isPending,
    error,
  };
}
