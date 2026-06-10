"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEther, zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { handlePayAbi, handleRegistryAbi } from "@/lib/abi";
import { HANDLEPAY_ADDRESS, REGISTRY_ADDRESS } from "@/lib/contracts";
import {
  formatUsd,
  isValidHandle,
  normalizeHandle,
  shortAddress,
} from "@/lib/format";
import { useTx } from "@/lib/useTx";
import {
  Note,
  Panel,
  PrimaryButton,
  Spinner,
  TxStatus,
  VerifiedBadge,
} from "@/components/ui";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SendPanel({ disabled }: { disabled: boolean }) {
  const { isConnected } = useAccount();
  const [handleInput, setHandleInput] = useState("");
  const [amountInput, setAmountInput] = useState("");

  // Pay-card links open the app as /app?to=handle — pre-fill the recipient.
  // Read from window.location on mount instead of useSearchParams so the
  // page needs no Suspense boundary.
  useEffect(() => {
    const to = new URLSearchParams(window.location.search).get("to");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window.location is unavailable during SSR; must set after mount
    if (to) setHandleInput(normalizeHandle(to));
  }, []);

  const handle = normalizeHandle(useDebounced(handleInput, 350));
  const handleValid = isValidHandle(handle);

  const ownerQuery = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: handleRegistryAbi,
    functionName: "ownerOf",
    args: handleValid ? [handle] : undefined,
    query: { enabled: Boolean(handleValid && REGISTRY_ADDRESS) },
  });

  const verifiedQuery = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: handleRegistryAbi,
    functionName: "isVerified",
    args: handleValid ? [handle] : undefined,
    query: { enabled: Boolean(handleValid && REGISTRY_ADDRESS) },
  });

  const owner = ownerQuery.data;
  const isRegistered = Boolean(owner && owner !== zeroAddress);
  const isVerified = verifiedQuery.data ?? false;
  const resolving =
    handleValid && (ownerQuery.isLoading || verifiedQuery.isLoading);

  const amountWei = useMemo(() => {
    const trimmed = amountInput.trim();
    if (!/^\d*\.?\d{0,18}$/.test(trimmed) || trimmed === "" || trimmed === ".")
      return null;
    try {
      const wei = parseEther(trimmed);
      return wei > 0n ? wei : null;
    } catch {
      return null;
    }
  }, [amountInput]);

  const sendTx = useTx();

  const onSend = () => {
    if (!HANDLEPAY_ADDRESS || !handleValid || !amountWei) return;
    sendTx.writeContract({
      address: HANDLEPAY_ADDRESS,
      abi: handlePayAbi,
      functionName: "payToHandle",
      args: [handle],
      value: amountWei,
    });
  };

  const canSend =
    !disabled &&
    isConnected &&
    handleValid &&
    Boolean(amountWei) &&
    !resolving &&
    !sendTx.isPending &&
    !sendTx.isConfirming;

  return (
    <Panel
      index="02"
      title="Send"
      subtitle="Pay any X handle in USDC — registered or not."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Recipient handle
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
                placeholder="recipient"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value.replace(/@/g, ""))}
                disabled={disabled}
                maxLength={16}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Amount (USD)
            </span>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-faint"
                aria-hidden
              >
                $
              </span>
              <input
                className="field pl-7"
                placeholder="5.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                disabled={disabled}
                inputMode="decimal"
                autoComplete="off"
              />
            </div>
          </label>
        </div>

        {handleInput && !isValidHandle(normalizeHandle(handleInput)) ? (
          <Note tone="warning">
            Handles are 1–15 characters: letters, digits, underscores.
          </Note>
        ) : null}

        {resolving ? <Spinner label={`Resolving @${handle}…`} /> : null}

        {!resolving && handleValid && ownerQuery.isError ? (
          <Note tone="error">
            Couldn&apos;t resolve @{handle} — the Arc RPC didn&apos;t respond.
            Try again.
          </Note>
        ) : null}

        {!resolving && handleValid && ownerQuery.isSuccess ? (
          isRegistered ? (
            <Note tone={isVerified ? "success" : "warning"}>
              <span className="flex flex-wrap items-center gap-2">
                <strong className="font-medium">Direct payment.</strong>
                @{handle} resolves to{" "}
                <span className="font-mono">{shortAddress(owner!)}</span>
                <VerifiedBadge verified={isVerified} />
              </span>
              {!isVerified ? (
                <span className="mt-1.5 block">
                  Warning: this handle is registered but{" "}
                  <strong>not verified</strong> — there is no proof the wallet
                  belongs to the real @{handle} on X. Funds go straight to that
                  wallet and cannot be recovered. Send only if you trust the
                  registration.
                </span>
              ) : null}
            </Note>
          ) : (
            <Note tone="warning">
              <strong className="font-medium">Escrow payment.</strong> @{handle}{" "}
              isn&apos;t registered yet, so your USDC will be held in escrow by
              the payment contract. It becomes claimable only after the real
              @{handle} registers <em>and</em> verifies with a tweet. Make sure
              the handle is spelled correctly.
            </Note>
          )
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <PrimaryButton onClick={onSend} disabled={!canSend}>
            {amountWei
              ? `Send ${formatUsd(amountWei)}${handleValid ? ` to @${handle}` : ""}`
              : "Send USDC"}
          </PrimaryButton>
          {!isConnected ? (
            <span className="text-xs text-faint">
              Connect a wallet to send.
            </span>
          ) : null}
        </div>

        <TxStatus {...sendTx} successLabel="Payment sent" />
      </div>
    </Panel>
  );
}
