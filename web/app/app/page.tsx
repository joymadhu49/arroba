import type { Metadata } from "next";
import ConnectButton from "@/components/ConnectButton";
import DeployBanner from "@/components/DeployBanner";
import NetworkGuard from "@/components/NetworkGuard";
import SignInGate from "@/components/SignInGate";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import ActivityFeed from "@/components/panels/ActivityFeed";
import ClaimPanel from "@/components/panels/ClaimPanel";
import PayCard from "@/components/panels/PayCard";
import RegisterPanel from "@/components/panels/RegisterPanel";
import SendPanel from "@/components/panels/SendPanel";
import VerifyPanel from "@/components/panels/VerifyPanel";
import { CONTRACTS_READY } from "@/lib/contracts";

export const metadata: Metadata = {
  title: "App",
  description:
    "Register your X handle, send USDC to any handle, verify with a tweet and claim escrowed funds — on Circle's Arc testnet.",
};

export default function AppPage() {
  const disabled = !CONTRACTS_READY;

  return (
    <div className="relative min-h-screen bg-background">
      <header className="hairline-b relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8">
        <div className="space-y-3">
          <DeployBanner />
          <NetworkGuard />
        </div>

        <SignInGate>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <SendPanel disabled={disabled} />
              <ActivityFeed />
              <PayCard />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <RegisterPanel disabled={disabled} />
              <VerifyPanel disabled={disabled} />
              <ClaimPanel disabled={disabled} />
            </div>
          </div>
        </SignInGate>
      </main>

      <footer className="hairline-t relative z-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-faint sm:px-8">
          <span>Arroba · a testnet demonstration on Circle&apos;s Arc</span>
          <span className="flex gap-5">
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring transition-colors hover:text-foreground"
            >
              USDC faucet ↗
            </a>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring transition-colors hover:text-foreground"
            >
              Explorer ↗
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
