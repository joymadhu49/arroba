"use client";

import { useState } from "react";
import { handleRegistryAbi } from "@/lib/abi";
import { REGISTRY_ADDRESS } from "@/lib/contracts";
import { isValidHandle, normalizeHandle } from "@/lib/format";
import { useMyHandle } from "@/lib/useMyHandle";
import { useTx } from "@/lib/useTx";
import {
  GhostButton,
  Note,
  Panel,
  PrimaryButton,
  TxStatus,
  VerifiedBadge,
} from "@/components/ui";

export default function RegisterPanel({ disabled }: { disabled: boolean }) {
  const { isConnected, handle, isRegistered, isVerified, refetch } =
    useMyHandle();
  const [input, setInput] = useState("");

  const registerTx = useTx(refetch);
  const releaseTx = useTx(refetch);

  const normalized = normalizeHandle(input);
  const inputValid = isValidHandle(normalized);

  const onRegister = () => {
    if (!REGISTRY_ADDRESS || !inputValid) return;
    registerTx.writeContract({
      address: REGISTRY_ADDRESS,
      abi: handleRegistryAbi,
      functionName: "register",
      args: [normalized],
    });
  };

  const onRelease = () => {
    if (!REGISTRY_ADDRESS) return;
    releaseTx.writeContract({
      address: REGISTRY_ADDRESS,
      abi: handleRegistryAbi,
      functionName: "release",
      args: [],
    });
  };

  return (
    <Panel
      index="01"
      title="Register"
      subtitle="Claim your X username on-chain. One handle per wallet."
    >
      {!isConnected ? (
        <Note>Connect a wallet to claim your handle.</Note>
      ) : isRegistered ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl text-foreground">
              @{handle}
            </span>
            <VerifiedBadge verified={isVerified} />
          </div>
          {!isVerified ? (
            <p className="text-[13px] leading-relaxed text-faint">
              Verify ownership in the panel below so senders know this handle
              is really yours — and so you can claim escrowed funds.
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <GhostButton
              onClick={onRelease}
              disabled={disabled || releaseTx.isPending || releaseTx.isConfirming}
            >
              Release handle
            </GhostButton>
          </div>
          <TxStatus {...releaseTx} successLabel="Handle released" />
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Your X username
            </span>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-faint"
                aria-hidden
              >
                @
              </span>
              <input
                className="field pl-8"
                placeholder="yourhandle"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/@/g, ""))}
                disabled={disabled}
                maxLength={16}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </label>
          {input && !inputValid ? (
            <Note tone="warning">
              Handles are 1–15 characters: letters, digits, underscores.
            </Note>
          ) : null}
          <PrimaryButton
            onClick={onRegister}
            disabled={
              disabled ||
              !inputValid ||
              registerTx.isPending ||
              registerTx.isConfirming
            }
          >
            Claim @{inputValid ? normalized : "handle"}
          </PrimaryButton>
          <TxStatus {...registerTx} successLabel="Handle registered" />
        </div>
      )}
    </Panel>
  );
}
