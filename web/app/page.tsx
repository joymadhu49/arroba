import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

const steps = [
  {
    n: "01",
    title: "Claim your handle",
    body: "Register your X username on-chain with one transaction. Your handle becomes your payment address — no hex strings, no QR codes.",
  },
  {
    n: "02",
    title: "Verify with one tweet",
    body: "Post a single public tweet containing your code. An attester checks it and marks your handle verified on-chain. No API keys, no passwords shared.",
  },
  {
    n: "03",
    title: "Get paid in USDC",
    body: "Anyone on Arc can pay @you in dollars, instantly. Funds sent before you joined wait safely in escrow until you claim them.",
  },
];

const features = [
  {
    title: "USDC-native gas",
    body: "Arc uses USDC as its gas token. One asset for payments and fees — no juggling a volatile coin just to move dollars.",
  },
  {
    title: "Sub-second finality",
    body: "Payments settle with sub-second finality on Arc. The money is simply there — before the conversation moves on.",
  },
  {
    title: "Escrow for new handles",
    body: "Pay any handle, even one that hasn't joined yet. The contract holds funds in escrow until the real owner registers and verifies.",
  },
  {
    title: "Verified-claim protection",
    body: "Escrowed money can only be claimed by a tweet-verified owner. Squatting a username gets you a string, not someone's dollars.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* ------------------------------------------------ header */}
      <header className="hairline-b relative z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Wordmark />
          <nav className="flex items-center gap-6 text-sm" aria-label="Primary">
            <a
              href="#how"
              className="focus-ring hidden text-muted transition-colors hover:text-foreground sm:inline"
            >
              How it works
            </a>
            <a
              href="#features"
              className="focus-ring hidden text-muted transition-colors hover:text-foreground sm:inline"
            >
              Features
            </a>
            <ThemeToggle />
            <Link
              href="/app"
              className="focus-ring rounded-xs bg-foreground px-4 py-2 font-medium text-background transition-opacity duration-200 hover:opacity-90"
            >
              Launch app
            </Link>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------ hero */}
      <section className="relative">
        <div className="aurora" aria-hidden />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 pt-20 pb-24 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:pt-28 lg:pb-32">
          <div>
            <p className="eyebrow mb-6">Built on Circle&apos;s Arc testnet</p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Pay anyone on X.
              <br />
              <span className="text-accent">In dollars.</span>
              <br />
              Instantly.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Arroba turns an X username into a payment address. Send USDC
              to <span className="font-mono text-accent">@anyone</span> —
              even before they&apos;ve heard of it. Settlement in under a
              second, on a chain where the gas is dollars too.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="focus-ring inline-flex items-center gap-2 rounded-xs bg-foreground px-7 py-3.5 text-sm font-medium tracking-wide text-background transition-all duration-200 hover:opacity-90 active:translate-y-px"
              >
                Launch the app
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#how"
                className="focus-ring inline-flex items-center gap-2 rounded-xs border border-line px-7 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-accent hover:bg-accent-soft"
              >
                How it works
              </a>
            </div>
            <p className="mt-8 text-xs text-faint">
              Testnet only · free USDC at{" "}
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring underline underline-offset-4 transition-colors hover:text-foreground"
              >
                faucet.circle.com
              </a>
            </p>
          </div>

          {/* hero artwork: a settled payment, framed like a plate in a catalogue */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="glass rounded-sm p-7">
              <p className="eyebrow mb-5">Payment · settled</p>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-3xl text-foreground">
                  @aurora_paints
                </span>
                <span className="font-display text-3xl text-foreground">
                  $250.00
                </span>
              </div>
              <div className="hairline-t mt-5 grid grid-cols-2 gap-3 pt-5 font-mono text-[11px] text-faint">
                <span>finality</span>
                <span className="text-right text-foreground">0.4s</span>
                <span>network</span>
                <span className="text-right">Arc Testnet</span>
                <span>gas paid in</span>
                <span className="text-right">USDC</span>
                <span>status</span>
                <span className="text-right text-success">
                  direct · verified ✓
                </span>
              </div>
            </div>
            <div className="glass mt-4 ml-10 rounded-sm p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-xl text-foreground">
                  @not_here_yet
                </span>
                <span className="font-display text-xl text-muted">
                  $12.50
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-warning">
                held in escrow · awaiting verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ how it works */}
      <section id="how" className="relative scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <p className="deco-rule eyebrow mb-14">How it works</p>
          <h2 className="font-display mx-auto mb-16 max-w-2xl text-center text-3xl tracking-tight text-foreground sm:text-4xl">
            Three steps between a username
            <br className="hidden sm:block" /> and a dollar.
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.n}
                className="glass glass-hover relative rounded-sm p-8"
              >
                <p className="eyebrow mb-4">{step.n}</p>
                <h3 className="font-display mb-3 text-xl text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-faint">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ features */}
      <section id="features" className="relative scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <p className="deco-rule eyebrow mb-14">Why Arroba</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="glass glass-hover relative rounded-sm p-8"
              >
                <h3 className="font-display mb-3 text-xl text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-faint">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-28 sm:px-8">
          <div className="glass relative overflow-hidden rounded-sm px-8 py-16 text-center sm:px-16">
            <h2 className="font-display mx-auto max-w-2xl text-3xl tracking-tight text-foreground sm:text-5xl">
              Your handle is your account.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
              Claim it before someone pays you and you don&apos;t even know.
              The escrow is patient — but why wait?
            </p>
            <div className="mt-9">
              <Link
                href="/app"
                className="focus-ring inline-flex items-center gap-2 rounded-xs bg-foreground px-8 py-4 text-sm font-medium tracking-wide text-background transition-all duration-200 hover:opacity-90 active:translate-y-px"
              >
                Claim your handle
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ footer */}
      <footer className="hairline-t relative">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-faint sm:px-8">
          <span>
            Arroba (<em>n.</em> — the name of the @ sign) · a testnet
            demonstration. Not affiliated with X Corp or Circle.
          </span>
          <span className="flex flex-wrap gap-6">
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
              Arc explorer ↗
            </a>
            <a
              href="https://www.circle.com/arc"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring transition-colors hover:text-foreground"
            >
              About Arc ↗
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
