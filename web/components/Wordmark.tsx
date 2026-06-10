import Link from "next/link";

export default function Wordmark() {
  return (
    <Link
      href="/"
      className="focus-ring group inline-flex items-baseline gap-2"
      aria-label="Arroba home"
    >
      <span className="font-display text-xl tracking-tight text-foreground">
        <span className="text-accent">@</span>rroba
      </span>
      <span className="hidden rounded-full border border-line px-2 py-0.5 text-[10px] tracking-[0.2em] text-faint uppercase transition-colors group-hover:border-accent/40 sm:inline-flex">
        Arc Testnet
      </span>
    </Link>
  );
}
