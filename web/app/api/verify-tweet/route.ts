import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { handleRegistryAbi } from "@/lib/abi";
import { arcTestnet } from "@/lib/chains";
import { REGISTRY_ADDRESS } from "@/lib/contracts";
import { isValidHandle, normalizeHandle } from "@/lib/format";
import { verificationCode } from "@/lib/verify";

export const runtime = "nodejs";

const TWEET_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
  "mobile.x.com",
]);

const STATUS_PATH = /^\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d+)/;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/verify-tweet  { handle, address, tweetUrl }
 *
 * Validates the tweet via Twitter's free, keyless oEmbed endpoint
 * (author must match the handle, body must contain the expected code),
 * then attests on-chain: HandleRegistry.setVerified(handle, true)
 * signed by ATTESTER_PRIVATE_KEY. Returns { txHash }.
 */
export async function POST(req: NextRequest) {
  let body: { handle?: string; address?: string; tweetUrl?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Request body must be JSON.");
  }

  const handle = normalizeHandle(body.handle ?? "");
  const address = (body.address ?? "").trim();
  const tweetUrl = (body.tweetUrl ?? "").trim();

  if (!isValidHandle(handle)) {
    return bad("Invalid handle. Use 1–15 letters, digits or underscores.");
  }
  if (!isAddress(address, { strict: false })) {
    return bad("Invalid wallet address.");
  }

  // --- 1. Validate the tweet URL --------------------------------------------
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(tweetUrl);
  } catch {
    return bad("That doesn't look like a URL. Paste the full link to your tweet.");
  }
  if (parsedUrl.protocol !== "https:" || !TWEET_HOSTS.has(parsedUrl.hostname)) {
    return bad("The link must be an x.com or twitter.com tweet URL.");
  }
  const match = parsedUrl.pathname.match(STATUS_PATH);
  if (!match) {
    return bad(
      "The link must point to a tweet (https://x.com/<user>/status/<id>).",
    );
  }
  const [, urlAuthor, tweetId] = match;

  // --- 2. Check server configuration ----------------------------------------
  const secret = process.env.VERIFY_SECRET;
  if (!secret) {
    return bad(
      "Verification is not configured on this server (VERIFY_SECRET is missing).",
      503,
    );
  }
  const expectedCode = verificationCode(handle, address, secret);

  // --- 3. Fetch the tweet via the keyless oEmbed endpoint -------------------
  const canonical = `https://twitter.com/${urlAuthor}/status/${tweetId}`;
  let oembed: { author_url?: string; html?: string };
  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(canonical)}&omit_script=true`,
      { headers: { accept: "application/json" }, cache: "no-store" },
    );
    if (res.status === 404) {
      return bad("Tweet not found. Is it public and not deleted?", 404);
    }
    if (!res.ok) {
      return bad(
        `Could not fetch the tweet (oEmbed responded ${res.status}). Try again shortly.`,
        502,
      );
    }
    oembed = (await res.json()) as { author_url?: string; html?: string };
  } catch {
    return bad("Could not reach Twitter's oEmbed service. Try again shortly.", 502);
  }

  // --- 4. Author must match the handle (case-insensitive) -------------------
  const authorUrl = oembed.author_url ?? "";
  const author = authorUrl.split("/").filter(Boolean).pop() ?? "";
  if (author.toLowerCase() !== handle) {
    return bad(
      `Wrong author: that tweet was posted by @${author || "unknown"}, not @${handle}.`,
      422,
    );
  }

  // --- 5. Tweet must contain the expected code -------------------------------
  const html = oembed.html ?? "";
  if (!html.toLowerCase().includes(expectedCode.toLowerCase())) {
    return bad(
      `Verification code not found in the tweet. Make sure it contains "${expectedCode}" exactly.`,
      422,
    );
  }

  // --- 6. Attest on-chain -----------------------------------------------------
  const attesterKey = process.env.ATTESTER_PRIVATE_KEY;
  if (!attesterKey || !/^0x[0-9a-fA-F]{64}$/.test(attesterKey)) {
    return bad(
      "Attester is not configured on this server (ATTESTER_PRIVATE_KEY is missing or malformed).",
      503,
    );
  }
  if (!REGISTRY_ADDRESS) {
    return bad(
      "Registry contract is not deployed/configured yet (NEXT_PUBLIC_REGISTRY_ADDRESS).",
      503,
    );
  }

  try {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    // The handle must be registered to the requesting address on-chain.
    const owner = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: handleRegistryAbi,
      functionName: "ownerOf",
      args: [handle],
    });
    if (owner === zeroAddress) {
      return bad(
        `@${handle} is not registered on-chain yet. Register it first, then verify.`,
        409,
      );
    }
    if (owner.toLowerCase() !== address.toLowerCase()) {
      return bad(
        `@${handle} is registered to a different address on-chain.`,
        409,
      );
    }

    const account = privateKeyToAccount(attesterKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });
    const txHash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: handleRegistryAbi,
      functionName: "setVerified",
      args: [handle, true],
    });

    return NextResponse.json({ ok: true, handle, txHash });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : "unknown error";
    return bad(`Failed to submit the attestation transaction: ${message}`, 502);
  }
}
