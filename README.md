# Arroba

**Live:** [arroba.vercel.app](https://arroba.vercel.app) · auto-deployed from `main` via Vercel

Pay anyone by their X (Twitter) handle on Circle's **Arc testnet** — where the
native gas token is USDC. No Twitter API keys anywhere: account ownership is
proven with a single public tweet, validated through Twitter's free, keyless
oEmbed endpoint.

**How it works**

- **Register** — claim your X username on-chain (`HandleRegistry`). Handles
  are canonical lowercase (`[a-z0-9_]{1,15}`); the contract rejects uppercase
  instead of normalizing.
- **Send** — `HandlePay.payToHandle("alice")` with native USDC. If `alice` is
  registered, funds go straight to her wallet. If not, they're held in escrow
  keyed by the handle.
- **Verify** — the app gives you a deterministic code
  (`arc-` + HMAC-SHA256(`handle|address`, `VERIFY_SECRET`)), you tweet it from
  the matching account, paste the tweet URL, and the server checks author +
  code via oEmbed, then attests on-chain with `setVerified(handle, true)`.
- **Claim** — escrowed funds are claimable **only by a verified handle**.
  Anyone can register a string, but only the real @alice on X can post the
  verification tweet — so squatters can't drain escrow.

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              Arc Testnet (5042002)          │
                    │                                             │
                    │  ┌────────────────┐      ┌───────────────┐  │
                    │  │ HandleRegistry │◄─────┤   HandlePay   │  │
                    │  │ handle ↔ owner │ reads│ pay / escrow  │  │
                    │  │ verified flags │      │ claim (USDC)  │  │
                    │  └───────▲────────┘      └───────▲───────┘  │
                    └──────────┼───────────────────────┼──────────┘
            setVerified()      │                       │  register / payToHandle /
            (attester key,     │                       │  claim  (user wallet via
             server-side)      │                       │  Reown AppKit + wagmi/viem)
                    ┌──────────┴───────────────────────┴──────────┐
                    │                web/  (Next.js)              │
                    │                                             │
                    │  panels: Register · Send · Verify · Claim   │
                    │  API: /api/verify-code   (HMAC code)        │
                    │       /api/verify-tweet  (check + attest)   │
                    └──────────────────────┬──────────────────────┘
                                           │ GET oembed?url=<tweet>
                                           │ (free, keyless)
                              ┌────────────▼──────────────┐
                              │ publish.twitter.com/oembed│
                              │ author + tweet text check │
                              └───────────────────────────┘
```

- `contracts/` — Foundry project: `HandleRegistry.sol`, `HandlePay.sol`,
  deploy script, 41 tests.
- `web/` — Next.js app: wagmi/viem + Reown AppKit frontend, plus the two
  server routes that generate codes and attest verifications. ABIs in
  `web/lib/abi.ts` are synced from the compiled Foundry artifacts (including
  custom errors, for proper revert decoding).

## Arc testnet

| | |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native gas token | USDC (18 decimals as native value) |

## Quickstart

### a) Get testnet USDC

Grab Arc testnet USDC for the deployer, the attester, and any wallet you'll
test with: **https://faucet.circle.com** (USDC is the gas token here — every
account needs some).

### b) Deploy the contracts

```bash
cd contracts
export PRIVATE_KEY=0x...        # deployer key (funded with testnet USDC)
export ATTESTER_ADDRESS=0x...   # address allowed to call setVerified()

forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast
```

The script prints the `HandleRegistry` and `HandlePay` addresses.

### c) Configure the web app

```bash
cd web
cp .env.example .env.local
```

Fill in:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Free project ID from https://cloud.reown.com |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | Deployed `HandleRegistry` address |
| `NEXT_PUBLIC_HANDLEPAY_ADDRESS` | Deployed `HandlePay` address |
| `VERIFY_SECRET` | Long random string (`openssl rand -hex 32`) — HMAC key for verification codes, server-only |
| `ATTESTER_PRIVATE_KEY` | Private key of `ATTESTER_ADDRESS`, server-only — signs `setVerified()` txs, needs a little USDC for gas |

### d) Run it

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000, connect a wallet on Arc testnet, and register →
send → verify → claim.

## Development

```bash
# contracts
cd contracts && forge test          # 41 tests

# web
cd web && npm run build
```
