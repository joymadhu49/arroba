"use client";

import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/chains";
import { useMounted } from "@/lib/useMounted";
import { GhostButton, Note } from "@/components/ui";

const ARC_CHAIN_HEX = `0x${arcTestnet.id.toString(16)}`;

const ADD_CHAIN_PARAMS = {
  chainId: ARC_CHAIN_HEX,
  chainName: arcTestnet.name,
  nativeCurrency: arcTestnet.nativeCurrency,
  rpcUrls: [...arcTestnet.rpcUrls.default.http],
  blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
};

/** Shown when the connected wallet is on a chain other than Arc Testnet. */
export default function NetworkGuard() {
  const { isConnected, chainId, connector } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const mounted = useMounted();

  if (!mounted || !isConnected || chainId === arcTestnet.id) return null;

  // The Coinbase Wallet extension only offers its built-in chain list — it
  // rejects wallet_addEthereumChain for custom networks like Arc Testnet.
  const cantAddCustomChains = /coinbase/i.test(connector?.name ?? "");

  const describeError = (err: unknown): string => {
    const e = err as { shortMessage?: string; message?: string };
    return e?.shortMessage ?? e?.message ?? "The wallet rejected the request.";
  };

  // wallet_switchEthereumChain first; wagmi falls back to
  // wallet_addEthereumChain (with the params below) on "unrecognized chain".
  const handleSwitch = async () => {
    setError(null);
    try {
      await switchChainAsync({
        chainId: arcTestnet.id,
        addEthereumChainParameter: {
          chainName: arcTestnet.name,
          nativeCurrency: arcTestnet.nativeCurrency,
          rpcUrls: [...arcTestnet.rpcUrls.default.http],
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
        },
      });
    } catch (err) {
      setError(describeError(err));
    }
  };

  // Last resort: talk to the wallet provider directly. Some wallets (Rabby
  // custom testnets among them) ignore the add-chain fallback inside
  // wallet_switchEthereumChain but accept an explicit wallet_addEthereumChain.
  const handleAddManually = async () => {
    setError(null);
    setAdding(true);
    try {
      const provider = (await connector?.getProvider()) as
        | { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
        | undefined;
      if (!provider) throw new Error("No wallet provider available.");
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [ADD_CHAIN_PARAMS],
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Note tone="warning">
      <span className="flex flex-wrap items-center gap-3">
        Wrong network: {connector?.name ?? "your wallet"} reports chain ID{" "}
        <strong>{chainId ?? "unknown"}</strong>, but Arroba runs only on Arc
        Testnet (chain <strong>{arcTestnet.id}</strong>). If the network named
        “Arc Testnet” in your wallet uses a different chain ID, delete it and
        re-add it with chain ID {arcTestnet.id}, RPC{" "}
        {arcTestnet.rpcUrls.default.http[0]}.
        <span className="flex items-center gap-2">
          <GhostButton
            className="px-3! py-1.5! text-xs!"
            onClick={handleSwitch}
            disabled={isPending || adding}
          >
            {isPending ? "Switching…" : "Switch to Arc Testnet"}
          </GhostButton>
          <GhostButton
            className="px-3! py-1.5! text-xs!"
            onClick={handleAddManually}
            disabled={isPending || adding}
          >
            {adding ? "Adding…" : "Add network to wallet"}
          </GhostButton>
        </span>
        {cantAddCustomChains && (
          <span className="basis-full text-xs">
            Note: {connector?.name} doesn&apos;t support adding custom networks
            like Arc Testnet. Disconnect (button next to your address) and
            reconnect with a wallet that does — Rabby or MetaMask — or use
            WalletConnect.
          </span>
        )}
        {error && (
          <span className="basis-full text-xs">
            Wallet said: {error}
          </span>
        )}
      </span>
    </Note>
  );
}
