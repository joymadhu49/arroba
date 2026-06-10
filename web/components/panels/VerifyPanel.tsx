"use client";

import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useMyHandle } from "@/lib/useMyHandle";
import {
  GhostButton,
  Note,
  Panel,
  PrimaryButton,
  Spinner,
  TxLink,
} from "@/components/ui";

type CodeResponse = { code: string; tweetText: string };

export default function VerifyPanel({ disabled }: { disabled: boolean }) {
  const { address, isConnected, handle, isRegistered, isVerified, refetch } =
    useMyHandle();

  const [code, setCode] = useState<CodeResponse | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [tweetUrl, setTweetUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [attestTx, setAttestTx] = useState<`0x${string}` | undefined>();

  const receipt = useWaitForTransactionReceipt({
    hash: attestTx,
    query: {
      enabled: Boolean(attestTx),
    },
  });

  // Once the attestation lands, refresh the verified flag.
  const attestationConfirmed = receipt.isSuccess;
  useEffect(() => {
    if (attestationConfirmed) refetch();
  }, [attestationConfirmed, refetch]);

  const getCode = async () => {
    if (!address || !handle) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const res = await fetch(
        `/api/verify-code?handle=${encodeURIComponent(handle)}&address=${address}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setCode(json as CodeResponse);
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Failed to fetch code.");
    } finally {
      setCodeLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — user can select the text manually.
    }
  };

  const submitTweet = async () => {
    if (!address || !handle || !tweetUrl.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    setAttestTx(undefined);
    try {
      const res = await fetch("/api/verify-tweet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, address, tweetUrl: tweetUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setAttestTx(json.txHash as `0x${string}`);
    } catch (e) {
      setVerifyError(
        e instanceof Error ? e.message : "Verification request failed.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const intentUrl = code
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(code.tweetText)}`
    : undefined;

  return (
    <Panel
      index="03"
      title="Verify"
      subtitle="Prove you own the X account with a single public tweet — no API keys, no DMs."
    >
      {!isConnected ? (
        <Note>Connect a wallet to verify your handle.</Note>
      ) : !isRegistered ? (
        <Note>Register a handle first, then come back to verify it.</Note>
      ) : isVerified ? (
        <Note tone="success">
          @{handle} is verified. Senders see the verified badge and your
          escrowed funds are claimable.
        </Note>
      ) : (
        <ol className="space-y-5">
          {/* Step 1 — code */}
          <li className="space-y-3">
            <p className="text-[13px] font-medium text-muted">
              <span className="eyebrow mr-2">Step 1</span> Get your one-time
              code
            </p>
            {code ? (
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-xs border border-line bg-surface-2 px-3 py-1.5 font-mono text-sm text-foreground">
                  {code.code}
                </code>
                <GhostButton onClick={copyCode} className="px-3! py-1.5! text-xs!">
                  {copied ? "Copied ✓" : "Copy"}
                </GhostButton>
              </div>
            ) : (
              <GhostButton onClick={getCode} disabled={disabled || codeLoading}>
                {codeLoading ? "Generating…" : "Generate code"}
              </GhostButton>
            )}
            {codeError ? <Note tone="error">{codeError}</Note> : null}
          </li>

          {/* Step 2 — tweet */}
          <li className="space-y-3">
            <p className="text-[13px] font-medium text-muted">
              <span className="eyebrow mr-2">Step 2</span> Post the tweet from
              @{handle}
            </p>
            {code ? (
              <>
                <blockquote className="rounded-xs border-l-2 border-l-accent/40 bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-muted italic">
                  {code.tweetText}
                </blockquote>
                <a
                  href={intentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-2 rounded-xs border border-line px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-accent hover:bg-accent-soft active:translate-y-px"
                >
                  Open pre-filled tweet ↗
                </a>
              </>
            ) : (
              <p className="text-[13px] text-faint">
                Generate your code first.
              </p>
            )}
          </li>

          {/* Step 3 — paste URL */}
          <li className="space-y-3">
            <p className="text-[13px] font-medium text-muted">
              <span className="eyebrow mr-2">Step 3</span> Paste the tweet link
            </p>
            <input
              className="field font-mono text-xs"
              placeholder="https://x.com/yourhandle/status/…"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              disabled={disabled || !code}
              autoComplete="off"
              spellCheck={false}
            />
            <PrimaryButton
              onClick={submitTweet}
              disabled={disabled || !code || !tweetUrl.trim() || verifying}
            >
              {verifying ? "Checking tweet…" : "Verify tweet"}
            </PrimaryButton>

            {verifyError ? <Note tone="error">{verifyError}</Note> : null}

            {attestTx && receipt.isLoading ? (
              <span className="flex items-center gap-3">
                <Spinner label="Attestation settling on Arc…" />
                <TxLink hash={attestTx} />
              </span>
            ) : null}
            {attestTx && receipt.isSuccess ? (
              <Note tone="success">
                Verified on-chain · <TxLink hash={attestTx} />
              </Note>
            ) : null}
            {attestTx && receipt.isError ? (
              <Note tone="error">
                The attestation transaction failed on-chain. Try verifying
                again.
              </Note>
            ) : null}
          </li>
        </ol>
      )}
    </Panel>
  );
}
