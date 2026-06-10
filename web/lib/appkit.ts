import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "wagmi";
import { arcTestnet } from "@/lib/chains";

/**
 * Reown (WalletConnect) project ID. Get a free one at https://cloud.reown.com.
 * The dummy fallback keeps the app rendering without one — wallet connections
 * over WalletConnect relay simply won't establish until a real ID is set.
 */
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  "00000000000000000000000000000000";

/** Arc Testnet as an AppKit network — the only network Arroba offers. */
export const arcAppKitNetwork = defineChain({
  ...arcTestnet,
  caipNetworkId: "eip155:5042002",
  chainNamespace: "eip155",
});

// Pinned on globalThis: this module is not a Fast Refresh boundary, so HMR
// re-executions would otherwise create a fresh adapter + wagmi config (with
// new window-level EIP-6963 listeners) on every edit while the AppKit modal
// stays wired to the first one.
const g = globalThis as typeof globalThis & { __hpWagmiAdapter?: WagmiAdapter };

export const wagmiAdapter = (g.__hpWagmiAdapter ??= new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [arcAppKitNetwork],
}));

export const wagmiConfig = wagmiAdapter.wagmiConfig;
