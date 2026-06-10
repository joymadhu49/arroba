import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeProvider from "@/components/ThemeProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Arroba — Pay anyone on X. In dollars. Instantly.",
    template: "%s · Arroba",
  },
  description:
    "Send USDC to any X (Twitter) handle on Circle's Arc testnet. Claim your handle, verify with one tweet, get paid in dollars with sub-second finality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Wallet extensions (Phantom, Rabby, Coinbase…) fight over
            window.ethereum and the loser throws an uncaught TypeError on
            every page load. Swallow errors originating from extension
            scripts before Next's dev overlay (or anything else) sees them —
            app errors are untouched since they never have an extension URL. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener("error",function(e){var f=e.filename||"";if(f.indexOf("-extension://")!==-1){e.stopImmediatePropagation();}},true);`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="grain" aria-hidden="true" />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
