"use client";

import type { ReactNode } from "react";
import { useMounted } from "@/lib/useMounted";
import { useSignIn } from "@/lib/useSignIn";
import { GhostButton, Note, Spinner } from "@/components/ui";

/**
 * Locks the app content between wallet connection and the sign-in signature:
 * a connected wallet that hasn't signed yet sees the content inert and a
 * prompt to confirm the (free) signature in the wallet.
 */
export default function SignInGate({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const { needsSignature, signIn, isPending, error } = useSignIn();

  const locked = mounted && needsSignature;

  return (
    <div className="space-y-6">
      {locked ? (
        <Note tone="info">
          <span className="flex flex-wrap items-center gap-3">
            <strong className="font-medium">One more step:</strong> sign the
            message in your wallet to prove this address is yours. It&apos;s
            free — not a transaction.
            {isPending ? (
              <Spinner label="Check your wallet…" />
            ) : (
              <GhostButton
                className="px-3! py-1.5! text-xs!"
                onClick={() => void signIn()}
              >
                Sign in with wallet
              </GhostButton>
            )}
            {error ? (
              <span className="basis-full text-xs">Wallet said: {error}</span>
            ) : null}
          </span>
        </Note>
      ) : null}
      <div
        inert={locked || undefined}
        className={locked ? "pointer-events-none opacity-40 select-none" : ""}
      >
        {children}
      </div>
    </div>
  );
}
