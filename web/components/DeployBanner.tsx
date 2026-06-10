import { CONTRACTS_READY } from "@/lib/contracts";
import { Note } from "@/components/ui";

/**
 * Shown while NEXT_PUBLIC_REGISTRY_ADDRESS / NEXT_PUBLIC_HANDLEPAY_ADDRESS
 * are unset or zero. On-chain actions are disabled until then.
 */
export default function DeployBanner() {
  if (CONTRACTS_READY) return null;
  return (
    <Note tone="warning">
      <strong className="font-medium">Contracts not deployed yet.</strong> The
      HandleRegistry and HandlePay contracts haven&apos;t been configured —
      set <code className="font-mono">NEXT_PUBLIC_REGISTRY_ADDRESS</code> and{" "}
      <code className="font-mono">NEXT_PUBLIC_HANDLEPAY_ADDRESS</code> in your
      environment. You can browse the interface, but on-chain actions are
      disabled.
    </Note>
  );
}
