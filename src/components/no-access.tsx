import { Lock } from "lucide-react";
import { EmptyState } from "./ui";

export function NoAccess({ what, owner }: { what: string; owner?: boolean }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white">
      <EmptyState icon={<Lock className="size-6" />} title={owner ? "Owner access needed" : "Owner or manager access needed"}>
        Your role can&apos;t {what}. Ask {owner ? "the owner" : "an owner or manager"} if you need changes.
      </EmptyState>
    </div>
  );
}
