"use client";

import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useRef, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { arcAppKitNetwork, projectId, wagmiAdapter } from "@/lib/appkit";

// Pinned on globalThis so Turbopack HMR re-executions of this module reuse
// the same instances instead of stacking live clients per hot reload.
const g = globalThis as typeof globalThis & {
  __hpQueryClient?: QueryClient;
  __hpAppKit?: ReturnType<typeof createAppKit>;
};

const queryClient = (g.__hpQueryClient ??= new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
}));

const modal = (g.__hpAppKit ??= createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arcAppKitNetwork],
  defaultNetwork: arcAppKitNetwork,
  metadata: {
    name: "Arroba",
    description:
      "Pay anyone on X by their handle — in USDC, on Circle's Arc testnet.",
    url: "https://arroba.vercel.app",
    icons: ["https://arroba.vercel.app/icon.png"],
  },
  themeVariables: {
    "--w3m-border-radius-master": "2px",
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  // Don't trap users in AppKit's own "Switch Network" modal when the wallet
  // reports an unknown chain — NetworkGuard handles switching (with an
  // add-chain fallback and visible errors, which the modal lacks).
  allowUnsupportedChain: true,
  // Never silently restore a previous session — connecting is always an
  // explicit user action (followed by a sign-in signature, see SignInGate).
  enableReconnect: false,
}));

/**
 * Keeps the AppKit modal in lockstep with next-themes — mode and accent
 * follow the app's resolved theme. Must render below ThemeProvider.
 *
 * Talks to the AppKit instance directly instead of useAppKitTheme(): that
 * hook returns new setter identities every render and mirrors controller
 * state, which made effect-deps re-fire on a store that re-notifies on
 * every write — an unbounded render→effect→store loop that froze the tab
 * ("Page Unresponsive"). The ref guard keeps the effect strictly
 * once-per-theme-change.
 */
function AppKitThemeSync() {
  const { resolvedTheme } = useTheme();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    if (applied.current === resolvedTheme) return;
    applied.current = resolvedTheme;
    modal.setThemeMode(resolvedTheme);
    modal.setThemeVariables({
      "--w3m-accent": resolvedTheme === "dark" ? "#a190f5" : "#5b5bd6",
    });
  }, [resolvedTheme]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      reconnectOnMount={false}
    >
      <QueryClientProvider client={queryClient}>
        <AppKitThemeSync />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
