"use client";

import { useReadContract } from "wagmi";
import { handlePayAbi } from "@/lib/abi";
import { HANDLEPAY_ADDRESS } from "@/lib/contracts";
import { formatUsd } from "@/lib/format";
import { useMyHandle } from "@/lib/useMyHandle";
import { useTx } from "@/lib/useTx";
import { Note, Panel, PrimaryButton, TxStatus } from "@/components/ui";

export default function ClaimPanel({ disabled }: { disabled: boolean }) {
  const { isConnected, handle, isRegistered, isVerified } = useMyHandle();

  const pendingQuery = useReadContract({
    address: HANDLEPAY_ADDRESS,
    abi: handlePayAbi,
    functionName: "pendingOf",
    args: isRegistered ? [handle] : undefined,
    query: { enabled: Boolean(isRegistered && HANDLEPAY_ADDRESS) },
  });

  const pending = pendingQuery.data ?? 0n;
  const claimTx = useTx(() => pendingQuery.refetch());

  const onClaim = () => {
    if (!HANDLEPAY_ADDRESS) return;
    claimTx.writeContract({
      address: HANDLEPAY_ADDRESS,
      abi: handlePayAbi,
      functionName: "claim",
      args: [],
    });
  };

  const canClaim =
    !disabled &&
    isRegistered &&
    isVerified &&
    pending > 0n &&
    !claimTx.isPending &&
    !claimTx.isConfirming;

  return (
    <Panel
      index="04"
      title="Claim"
      subtitle="USDC sent to your handle before you registered waits in escrow."
    >
      {!isConnected ? (
        <Note>Connect a wallet to see your escrow balance.</Note>
      ) : !isRegistered ? (
        <Note>Register your handle first — escrow is keyed by handle.</Note>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-1">Escrowed for @{handle}</p>
            <p className="font-display text-4xl tracking-tight text-foreground">
              {pendingQuery.isLoading ? "—" : formatUsd(pending)}
            </p>
          </div>

          {pendingQuery.isError ? (
            <Note tone="error">
              Couldn&apos;t read your escrow balance from the Arc RPC. Try
              again shortly.
            </Note>
          ) : null}

          {!isVerified ? (
            <Note tone="warning">
              Claiming is locked until your handle is{" "}
              <strong>verified</strong>. This protects escrowed funds from
              squatters: anyone can register a string, but only the real
              @{handle} on X can post the verification tweet. Complete the
              Verify step above to unlock.
            </Note>
          ) : pending === 0n && pendingQuery.isSuccess ? (
            <p className="text-[13px] text-faint">
              Nothing in escrow right now. Payments sent to @{handle} while you
              were unregistered would appear here.
            </p>
          ) : null}

          <PrimaryButton onClick={onClaim} disabled={!canClaim}>
            {pending > 0n ? `Claim ${formatUsd(pending)}` : "Claim"}
          </PrimaryButton>

          <TxStatus {...claimTx} successLabel="Escrow claimed" />
        </div>
      )}
    </Panel>
  );
}
