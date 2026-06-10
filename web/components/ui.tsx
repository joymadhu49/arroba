import Link from "next/link";
import type { ReactNode } from "react";
import { explorerTxUrl } from "@/lib/chains";
import { shortHash } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */

const buttonBase =
  "focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xs text-sm font-medium tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${buttonBase} bg-foreground px-5 py-2.5 text-background hover:opacity-90 active:translate-y-px ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${buttonBase} border border-line bg-transparent px-5 py-2.5 text-foreground hover:border-accent hover:bg-accent-soft active:translate-y-px ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Panel chrome                                                         */
/* ------------------------------------------------------------------ */

export function Panel({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-sm p-6 sm:p-8" aria-label={title}>
      <header className="mb-6">
        <p className="eyebrow mb-2">
          {index} — {title}
        </p>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-faint">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Status & feedback                                                    */
/* ------------------------------------------------------------------ */

type NoteTone = "info" | "success" | "warning" | "error";

const toneStyles: Record<NoteTone, string> = {
  info: "border-info/25 bg-info-soft text-info",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  error: "border-danger/30 bg-danger-soft text-danger",
};

export function Note({
  tone = "info",
  children,
}: {
  tone?: NoteTone;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xs border px-3.5 py-3 text-[13px] leading-relaxed ${toneStyles[tone]}`}
    >
      {children}
    </div>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-success">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 6.5L4.5 9L10 3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-warning">
      Unverified
    </span>
  );
}

export function TxLink({ hash }: { hash: string }) {
  return (
    <Link
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring font-mono text-xs text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-foreground"
    >
      {shortHash(hash)} ↗
    </Link>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-faint">
      <svg
        className="h-3.5 w-3.5 animate-spin text-accent"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label ?? "Working…"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Transaction lifecycle line                                           */
/* ------------------------------------------------------------------ */

export function TxStatus({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  error,
  successLabel = "Confirmed",
}: {
  hash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: Error | null;
  successLabel?: string;
}) {
  if (error) {
    const message = error.message.split("\n")[0];
    return (
      <Note tone="error">
        {message.length > 160 ? `${message.slice(0, 160)}…` : message}
      </Note>
    );
  }
  if (isPending) return <Spinner label="Confirm in your wallet…" />;
  if (isConfirming)
    return (
      <span className="flex items-center gap-3">
        <Spinner label="Settling on Arc…" />
        {hash ? <TxLink hash={hash} /> : null}
      </span>
    );
  if (isSuccess && hash)
    return (
      <Note tone="success">
        {successLabel} · <TxLink hash={hash} />
      </Note>
    );
  return null;
}
