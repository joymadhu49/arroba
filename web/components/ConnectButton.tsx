"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";

const chipBase =
  "focus-ring inline-flex cursor-pointer items-center gap-2.5 rounded-xs border px-4 py-2 text-sm font-medium transition-all duration-200 active:translate-y-px";

export default function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  // Avoid SSR/client hydration mismatch: wallet state only exists client-side.
  const mounted = useMounted();

  const connected = mounted && isConnected && address;
  const wrongNetwork = connected && chainId !== arcTestnet.id;

  if (!connected) {
    return (
      <button
        type="button"
        onClick={() => open({ view: "Connect" })}
        className={`${chipBase} border-accent/40 bg-accent-soft text-foreground hover:border-accent`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        Connect wallet
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => open({ view: "Account" })}
        title={
          wrongNetwork
            ? `Connected on the wrong network (chain ${chainId}) — expected Arc Testnet`
            : `Connected to Arc Testnet as ${address}`
        }
        className={`${chipBase} ${
          wrongNetwork
            ? "border-warning/40 bg-warning-soft text-foreground hover:border-warning"
            : "border-success/30 bg-success-soft text-foreground hover:border-success/50"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            wrongNetwork ? "bg-warning" : "bg-success"
          }`}
          aria-hidden
        />
        {shortAddress(address)}
        {wrongNetwork ? (
          <span className="text-xs text-warning">wrong network</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => disconnect()}
        aria-label="Disconnect wallet"
        title="Disconnect wallet"
        className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-xs border border-line p-2 text-faint transition-all duration-200 hover:border-danger/50 hover:bg-danger-soft hover:text-danger active:translate-y-px"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7.5 5.5a8 8 0 1 0 9 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}
