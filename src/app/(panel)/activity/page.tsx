import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { History } from "lucide-react";
import { can } from "@emrix/shared/admin";
import { fmtDateTime, timeAgo } from "@emrix/shared/time";
import { EmptyState, PageHeader } from "@/components/ui";
import { ListFilters } from "@/components/list-filters";
import { NoAccess } from "@/components/no-access";
import { Pager } from "@/components/pager";
import { listActivity } from "@/lib/backend";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 50;

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const admin = await requireAdmin();
  if (!can(admin.role, "activity:view")) return <NoAccess what="view the activity log" />;
  const sp = await searchParams;
  const actor = typeof sp.actor === "string" ? sp.actor : undefined;
  const { rows, total, page, pages, actors } = await listActivity({ page: Number(sp.page) || 1, pageSize: PAGE_SIZE, actor });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (actor) params.set("actor", actor);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/activity${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader jp="履歴" title="Activity" description="Every change made in the admin panel, newest first." />
      {actors.length > 1 && (
        <div className="mb-4">
          <Suspense>
            <ListFilters selects={[{ key: "actor", label: "Everyone", aria: "Team member", options: actors.map((a) => [a, a] as const) }]} />
          </Suspense>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white">
          <EmptyState icon={<History className="size-6" />} title="Nothing yet">
            Order updates, catalogue edits and settings changes show up here.
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <ul className="divide-y divide-ink/[0.06]">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3 text-sm sm:px-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper font-display text-[10px]">
                  {r.actor
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-semibold">{r.actor}</span> <span className="text-ink/70">{r.action.charAt(0).toLowerCase() + r.action.slice(1)}</span>
                    {r.target &&
                      (/^EMX-[A-Z0-9]+$/.test(r.target) ? (
                        <>
                          {" "}
                          <Link href={`/orders/${r.target}`} className="font-mono font-semibold hover:text-shu">
                            {r.target}
                          </Link>
                        </>
                      ) : (
                        <span className="font-medium"> · {r.target}</span>
                      ))}
                  </p>
                  <p className="text-xs text-ink/50" title={fmtDateTime(r.at)}>
                    {timeAgo(r.at)} · {fmtDateTime(r.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Pager page={page} pages={pages} total={total} pageSize={PAGE_SIZE} href={href} />
    </>
  );
}
