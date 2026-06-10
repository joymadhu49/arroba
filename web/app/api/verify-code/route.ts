import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { isValidHandle, normalizeHandle } from "@/lib/format";
import { tweetText, verificationCode } from "@/lib/verify";

export const runtime = "nodejs";

/**
 * GET /api/verify-code?handle=<x_username>&address=0x...
 *
 * Returns a deterministic verification code:
 * "arc-" + first 10 hex chars of HMAC-SHA256("handle|address", VERIFY_SECRET).
 */
export async function GET(req: NextRequest) {
  const rawHandle = req.nextUrl.searchParams.get("handle") ?? "";
  const address = req.nextUrl.searchParams.get("address") ?? "";

  const handle = normalizeHandle(rawHandle);
  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: "Invalid handle. Use 1–15 letters, digits or underscores." },
      { status: 400 },
    );
  }
  if (!isAddress(address, { strict: false })) {
    return NextResponse.json(
      { error: "Invalid wallet address." },
      { status: 400 },
    );
  }

  const secret = process.env.VERIFY_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Verification is not configured on this server (VERIFY_SECRET is missing).",
      },
      { status: 503 },
    );
  }

  const code = verificationCode(handle, address, secret);
  return NextResponse.json({
    handle,
    address,
    code,
    tweetText: tweetText(handle, code),
  });
}
