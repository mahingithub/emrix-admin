"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Boxes,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { can, ROLE_LABEL, type AdminUser, type Permission } from "@emrix/shared/admin";
import { cn } from "@emrix/shared/utils";
import { Logo } from "@emrix/shared/ui/logo";
import { logoutAction } from "@/actions/admin";
import { shopUrl } from "@/lib/shop";

type NavItem = { href: string; label: string; Icon: typeof Boxes; badge?: number; needs?: Permission };

function buildNav(admin: AdminUser, newOrders: number): { section: string; items: NavItem[] }[] {
  const groups: { section: string; items: NavItem[] }[] = [
    { section: "Overview", items: [{ href: "/", label: "Dashboard", Icon: LayoutDashboard }] },
    {
      section: "Sales",
      items: [
        { href: "/orders", label: "Orders", Icon: ShoppingBag, badge: newOrders },
        { href: "/customers", label: "Customers", Icon: Users, needs: "customers:view" },
      ],
    },
    {
      section: "Catalogue",
      items: [
        { href: "/products", label: "Products", Icon: Shirt },
        { href: "/inventory", label: "Inventory", Icon: Boxes },
        { href: "/anime", label: "Anime", Icon: Sparkles },
      ],
    },
    { section: "Marketing", items: [{ href: "/coupons", label: "Coupons", Icon: TicketPercent, needs: "coupons:edit" }] },
    {
      section: "Store",
      items: [
        { href: "/settings", label: "Settings", Icon: Settings, needs: "settings:edit" },
        { href: "/staff", label: "Staff", Icon: ShieldCheck, needs: "staff:manage" },
        { href: "/activity", label: "Activity", Icon: History, needs: "activity:view" },
      ],
    },
  ];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.needs || can(admin.role, i.needs)) }))
    .filter((g) => g.items.length);
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AdminShell({ admin, newOrders, children }: { admin: AdminUser; newOrders: number; children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const nav = buildNav(admin, newOrders);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Link href="/" onClick={onNavigate} aria-label="Dashboard">
          <Logo invert />
        </Link>
        {!onNavigate && (
          <span className="rounded-md bg-paper/10 px-1.5 py-0.5 font-jp text-[10px] font-bold tracking-widest text-paper/70">管理</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {nav.map((group) => (
          <div key={group.section} className="mt-4 first:mt-1">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/35">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive(pathname, item.href) ? "bg-paper text-ink" : "text-paper/75 hover:bg-paper/10 hover:text-paper",
                    )}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  >
                    <item.Icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-shu px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-paper/10 px-4 py-4">
        <Link
          href="/account"
          onClick={onNavigate}
          className="-m-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 hover:bg-paper/10"
          title="Your account"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-kin font-display text-xs text-ink">
            {admin.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-paper">{admin.name}</span>
            <span className="block text-xs text-paper/50">{ROLE_LABEL[admin.role]} · Account</span>
          </span>
        </Link>
        <form action={logoutAction}>
          <button className="grid size-9 place-items-center rounded-lg text-paper/60 hover:bg-paper/10 hover:text-paper" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f1ec] text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">{sidebar()}</aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", !drawer && "pointer-events-none")} inert={!drawer}>
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 bg-ink transition-transform duration-300",
            drawer ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setDrawer(false)}
            className="absolute right-3 top-4 z-10 grid size-9 place-items-center rounded-lg text-paper/70 hover:bg-paper/10"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
          {sidebar(() => setDrawer(false))}
        </aside>
      </div>

      <div className="lg:pl-64">
        <TopBar onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick">
        {[
          { href: "/", label: "Home", Icon: LayoutDashboard },
          { href: "/orders", label: "Orders", Icon: ShoppingBag, badge: newOrders },
          // The shop is a separate site.
          { href: shopUrl(), label: "Store", Icon: Store, external: true },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold",
              !item.external && isActive(pathname, item.href) ? "text-shu" : "text-ink/55",
            )}
          >
            <item.Icon className="size-5" />
            {item.label}
            {!!item.badge && (
              <span className="absolute right-[calc(50%-20px)] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-shu px-1 text-[9px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-ink/55">
          <Menu className="size-5" />
          Menu
        </button>
      </nav>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.07] bg-[#f3f1ec]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenu} className="-ml-1 grid size-10 place-items-center rounded-lg hover:bg-ink/5 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/orders?q=${encodeURIComponent(q.trim())}` : "/orders");
          }}
          className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 focus-within:border-ink/40 sm:max-w-md"
        >
          <Search className="size-4 shrink-0 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order ID, phone or name…"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
            aria-label="Search orders"
          />
        </form>
        <Link
          href={shopUrl()}
          target="_blank"
          className="ml-auto hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink sm:inline-flex"
        >
          View store <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
