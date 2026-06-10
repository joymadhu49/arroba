# Arroba

Pay anyone by their X (Twitter) username — in USDC, on [Circle's Arc](https://www.circle.com/arc) testnet.

- **Landing page** (`/`) — what Arroba is and how it works.
- **App** (`/app`) — connect a wallet, register your handle, send USDC to any handle (direct or escrow), verify ownership with one tweet, and claim escrowed funds.

## Stack

Next.js (App Router, TypeScript, Tailwind v4) · Reown AppKit (WalletConnect) · wagmi v2 · viem · TanStack Query.

Arc Testnet is the only network offered: chain id `5042002`, RPC `https://rpc.testnet.arc.network`, explorer `https://testnet.arcscan.app`. The native gas token is **USDC with 18 decimals**, so amounts use `parseEther`/`formatEther` and display as dollars.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

`npm run build` passes with no env vars set at all — every variable is guarded.

## Environment variables

| Variable | Side | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | client | Reown (WalletConnect) project ID. **Get one free at [cloud.reown.com](https://cloud.reown.com)** — create a project and copy its ID. Without it the UI still renders with a dummy ID, but wallet connections through the WalletConnect relay won't establish. |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | client | Deployed `HandleRegistry` address on Arc Testnet. Unset/zero → the app shows a "contracts not deployed yet" banner and disables on-chain actions. |
| `NEXT_PUBLIC_HANDLEPAY_ADDRESS` | client | Deployed `HandlePay` address on Arc Testnet. Same banner behavior as above. |
| `VERIFY_SECRET` | server | Secret for deriving deterministic tweet-verification codes (`arc-` + first 10 hex chars of `HMAC-SHA256("handle\|address")`). Any long random string: `openssl rand -hex 32`. |
| `ATTESTER_PRIVATE_KEY` | server | Private key (`0x` + 64 hex) of the attester account allowed to call `HandleRegistry.setVerified`. Fund it with a little testnet USDC for gas. |

## Testnet USDC

Get free Arc testnet USDC (it's the gas token too) from Circle's faucet: **<https://faucet.circle.com>** — select Arc Testnet and paste your address.

## How verification works (no Twitter API)

1. The app requests `GET /api/verify-code?handle=<x_user>&address=0x…`, which returns a deterministic code derived from `VERIFY_SECRET`.
2. The user posts a pre-filled tweet containing that code.
3. The user pastes the tweet URL; `POST /api/verify-tweet` validates it, fetches Twitter's free keyless oEmbed endpoint (`publish.twitter.com/oembed`), checks the author matches the handle and the code is present, then the attester signs `setVerified(handle, true)` on-chain and the tx hash is returned.

## Project layout

```
app/
  page.tsx                  # landing page
  app/page.tsx              # the dApp (register / send / verify / claim / activity)
  api/verify-code/route.ts  # deterministic verification code (HMAC)
  api/verify-tweet/route.ts # oEmbed check + on-chain attestation
  providers.tsx             # AppKit + wagmi + react-query providers
components/                 # panels and UI primitives
lib/
  abi.ts                    # hand-written ABIs (sync with deployed artifacts)
  chains.ts                 # Arc Testnet chain definition
  appkit.ts                 # Reown AppKit / wagmi adapter config
  contracts.ts              # env-guarded contract addresses
  verify.ts                 # HMAC verification-code helper
```

> Contracts are developed separately; `lib/abi.ts` is written against the agreed interface and should be synced with the compiled artifacts at integration time.
