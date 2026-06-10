import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // `@wagmi/core`'s optional Tempo connector dynamically imports an
      // optional "accounts" package that isn't installed. Turbopack fails the
      // build on the unresolved specifier, so alias it to an empty stub —
      // HandlePay never uses the Tempo connector.
      accounts: "./lib/empty-module.ts",
    },
  },
};

export default nextConfig;
