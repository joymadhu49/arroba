"use client";

import { useEffect, useRef, useState } from "react";
import { arcTestnet } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { useMyHandle } from "@/lib/useMyHandle";
import { GhostButton, Panel, VerifiedBadge } from "@/components/ui";

/**
 * The user's shareable "pay card" — a gallery-piece card for their handle
 * plus a link that opens the app with the Send panel pre-filled (?to=handle).
 * Sharing uses a tweet intent URL: no X API involved.
 */
export default function PayCard() {
  const { handle, isRegistered, isVerified, isConnected, address } =
    useMyHandle();
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const origin = mounted ? window.location.origin : "";
  const payLink = isRegistered ? `${origin}/app?to=${handle}` : "";
  const payLinkDisplay = payLink.replace(/^https?:\/\//, "");

  const tweetUrl = isRegistered
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Pay me in USDC by my X handle — no wallet address needed. ${payLink}`,
      )}`
    : "";

  const onCopy = async () => {
    if (!payLink) return;
    try {
      await navigator.clipboard.writeText(payLink);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / http) — leave the link visible to select manually.
    }
  };

  return (
    <Panel
      index="05"
      title="Share"
      subtitle="Your pay card. Anyone who opens your link lands here with your handle already filled in."
    >
      <div className="space-y-4">
        <div className="paycard p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="eyebrow">Arroba — Pay Card</span>
              <span className="font-mono text-[10px] tracking-widest text-faint">
                ARC · {arcTestnet.id}
              </span>
            </div>

            {mounted && isRegistered ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
                  @{handle}
                </span>
                <VerifiedBadge verified={isVerified} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="font-display text-4xl tracking-tight text-foreground/40 sm:text-5xl">
                  @yourhandle
                </span>
                <p className="text-[13px] leading-relaxed text-faint">
                  {mounted && isConnected
                    ? "Claim your handle in 01 — Register to mint your pay card."
                    : "Connect a wallet and claim your handle to mint your pay card."}
                </p>
              </div>
            )}

            <div className="hairline-t flex flex-wrap items-center justify-between gap-3 pt-4">
              <span className="font-mono text-xs text-faint">
                {mounted && address ? shortAddress(address) : "0x····"}
              </span>
              <span className="max-w-full truncate font-mono text-xs text-accent">
                {mounted && isRegistered ? payLinkDisplay : "— · —"}
              </span>
            </div>
          </div>
        </div>

        {mounted && isRegistered ? (
          <div className="flex flex-wrap items-center gap-3">
            <GhostButton className="px-4! py-2! text-xs!" onClick={onCopy}>
              {copied ? "Copied ✓" : "Copy pay link"}
            </GhostButton>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xs border border-line bg-transparent px-4 py-2 text-xs font-medium tracking-wide text-foreground transition-all duration-200 hover:border-accent hover:bg-accent-soft active:translate-y-px"
            >
              Share on X ↗
            </a>
            <span className="text-xs text-faint">
              Payments to @{handle} go straight to your wallet.
            </span>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
