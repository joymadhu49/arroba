"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { claimedEvent, paymentSentEvent } from "@/lib/abi";
import { arcTestnet } from "@/lib/chains";
import { HANDLEPAY_ADDRESS } from "@/lib/contracts";
import { formatUsd, shortAddress } from "@/lib/format";
import { GhostButton, Note, Spinner, TxLink } from "@/components/ui";

const LOOKBACK_BLOCKS = 5000n;
const MAX_ITEMS = 25;

type ActivityItem = {
  key: string;
  kind: "direct" | "escrow" | "claim";
  handle: string;
  amount: bigint;
  counterparty: string;
  txHash: string;
  blockNumber: bigint;
};

const kindMeta: Record<
  ActivityItem["kind"],
  { label: string; className: string }
> = {
  direct: {
    label: "Direct",
    className: "border-success/30 bg-success-soft text-success",
  },
  escrow: {
    label: "Escrow",
    className: "border-warning/30 bg-warning-soft text-warning",
  },
  claim: {
    label: "Claimed",
    className: "border-info/30 bg-info-soft text-info",
  },
};

export default function ActivityFeed() {
  const client = usePublicClient({ chainId: arcTestnet.id });

  const query = useQuery({
    queryKey: ["handlepay-activity", HANDLEPAY_ADDRESS],
    enabled: Boolean(client && HANDLEPAY_ADDRESS),
    refetchInterval: 30_000,
    retry: 1,
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!client || !HANDLEPAY_ADDRESS) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : 0n;
      const logs = await client.getLogs({
        address: HANDLEPAY_ADDRESS,
        events: [paymentSentEvent, claimedEvent],
        fromBlock,
        toBlock: latest,
      });

      const items: ActivityItem[] = [];
      for (const log of logs) {
        if (log.eventName === "PaymentSent") {
          const { handle, from, amount, escrowed } = log.args;
          if (handle === undefined || amount === undefined) continue;
          items.push({
            key: `${log.transactionHash}-${log.logIndex}`,
            kind: escrowed ? "escrow" : "direct",
            handle,
            amount,
            counterparty: from ?? "",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        } else if (log.eventName === "Claimed") {
          const { handle, to, amount } = log.args;
          if (handle === undefined || amount === undefined) continue;
          items.push({
            key: `${log.transactionHash}-${log.logIndex}`,
            kind: "claim",
            handle,
            amount,
            counterparty: to ?? "",
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }
      items.sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1));
      return items.slice(0, MAX_ITEMS);
    },
  });

  return (
    <section className="glass rounded-sm p-6 sm:p-8" aria-label="Recent activity">
      <header className="mb-6 flex items-center justify-between gap-4">
        <p className="eyebrow">Recent activity</p>
        <GhostButton
          className="px-3! py-1.5! text-xs!"
          onClick={() => query.refetch()}
          disabled={query.isFetching || !HANDLEPAY_ADDRESS}
        >
          {query.isFetching ? "Refreshing…" : "Refresh"}
        </GhostButton>
      </header>

      {!HANDLEPAY_ADDRESS ? (
        <Note>
          Activity will appear here once the payment contract is deployed and
          configured.
        </Note>
      ) : query.isLoading ? (
        <Spinner label="Reading the last 5,000 blocks…" />
      ) : query.isError ? (
        <Note tone="error">
          Couldn&apos;t load recent activity — the Arc RPC didn&apos;t respond.
          The chain is fine; this view just couldn&apos;t refresh. Use the
          refresh button to retry.
        </Note>
      ) : query.data && query.data.length > 0 ? (
        <ul className="divide-y divide-line">
          {query.data.map((item) => {
            const meta = kindMeta[item.kind];
            return (
              <li
                key={item.key}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 text-sm"
              >
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${meta.className}`}
                >
                  {meta.label}
                </span>
                <span className="font-medium text-foreground">
                  @{item.handle}
                </span>
                <span className="font-display text-base text-foreground">
                  {formatUsd(item.amount)}
                </span>
                <span className="font-mono text-xs text-faint">
                  {item.kind === "claim" ? "to" : "from"}{" "}
                  {shortAddress(item.counterparty)}
                </span>
                <span className="ml-auto">
                  <TxLink hash={item.txHash} />
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-faint">
          No payments in the last 5,000 blocks. Be the first — send someone a
          dollar.
        </p>
      )}
    </section>
  );
}
