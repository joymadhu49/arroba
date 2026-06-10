# HandlePay Contracts

Pay anyone by their X (Twitter) username on [Circle's Arc testnet](https://testnet.arcscan.app).

Arc is EVM-compatible, but its **native gas/value token is USDC** (18 decimals for
native value). All payments in this protocol move native value — there is no ERC-20
involved, and **gas is paid in USDC**.

| | |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |

## Contracts

- **`src/HandleRegistry.sol`** — maps handles (1–15 chars, `a-z0-9_` only,
  uppercase rejected) to addresses. One handle per address; `release()` to change.
  A designated **attester** marks handles as verified after off-chain proof of
  X account ownership, and can rotate itself via `setAttester`.
- **`src/HandlePay.sol`** — `payToHandle(handle)` forwards native USDC directly to
  the handle's owner if registered, otherwise escrows it keyed by
  `keccak256(handle)`. `claim()` pays out escrow to the handle owner, but **only
  if the handle is verified** — this stops squatters from registering someone
  else's username to steal escrowed funds. Claims follow
  checks-effects-interactions and are reentrancy-guarded.

## Setup

```sh
forge build
forge test
```

## Getting testnet USDC

Gas (and payment value) on Arc testnet is native USDC. Fund your deployer
address at the Circle faucet:

1. Go to **https://faucet.circle.com**
2. Select the **Arc testnet** network.
3. Paste your deployer address and request USDC.

## Deploy

Set the required environment variables, then run the deploy script:

```sh
export PRIVATE_KEY=0x...        # deployer key (funded with Arc testnet USDC)
export ATTESTER_ADDRESS=0x...   # address allowed to verify handles

forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.arc.network --broadcast
```

The script deploys `HandleRegistry(attester)` then `HandlePay(registry)` and logs
both addresses. Verify them on the explorer at https://testnet.arcscan.app.

> Note: because Arc's native token is USDC, deployment gas is paid in USDC —
> make sure the deployer address holds faucet USDC before broadcasting.

## ABIs

After `forge build`, frontend-ready artifacts live at:

- `out/HandleRegistry.sol/HandleRegistry.json`
- `out/HandlePay.sol/HandlePay.json`
