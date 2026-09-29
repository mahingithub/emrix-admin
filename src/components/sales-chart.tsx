"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatBDT } from "@emrix/shared/utils";

type Point = { date: string; sales: number; orders: number };

const H = 260;
const PAD = { top: 16, right: 8, bottom: 30, left: 52 };
const INK = "#1c1c24";
const ACCENT = "#e5322b";
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#898781";

function niceStep(max: number) {
  if (max <= 0) return 1;
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

const compact = (n: number, money: boolean) => {
  const s = n >= 1000 ? `${Math.round((n / 1000) * 10) / 10}K` : String(Math.round(n));
  return money ? `৳${s}` : s;
};

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Daily sales (or orders) column chart. Today is the accent bar. */
export function SalesChart({ data, metric }: { data: Point[]; metric: "sales" | "orders" }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const money = metric === "sales";
  const values = data.map((d) => d[metric]);
  const step = niceStep(Math.max(...values, 1));
  const top = Math.max(step, Math.ceil(Math.max(...values, 1) / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 70))));

  const total = values.reduce((a, b) => a + b, 0);
  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink/55">
          {money ? "Sales per day, excluding cancelled orders" : "Orders per day"} · total{" "}
          <span className="font-semibold text-ink">{money ? formatBDT(total) : total}</span>
        </p>
        <div className="inline-flex rounded-lg border border-ink/10 p-0.5 text-xs font-semibold">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("rounded-md px-2.5 py-1 capitalize", view === v ? "bg-ink text-paper" : "text-ink/60 hover:text-ink")}
              aria-pressed={view === v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <div className="max-h-[260px] overflow-y-auto rounded-xl border border-ink/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-paper text-left text-xs text-ink/55">
              <tr>
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 text-right font-semibold">Orders</th>
                <th className="px-3 py-2 text-right font-semibold">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5">{dayLabel(d.date)}</td>
                  <td className="px-3 py-1.5 text-right">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right">{formatBDT(d.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative h-[260px]" onPointerLeave={() => setHover(null)}>
          {width > 0 && (
            <svg width={width} height={H} role="group" aria-label={money ? "Daily sales chart" : "Daily orders chart"}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
                  <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={11} fill={MUTED} className="tabular-nums">
                    {compact(t, money)}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const v = d[metric];
                const x = PAD.left + i * band + (band - barW) / 2;
                const barH = Math.max(0, (v / top) * plotH);
                const r = Math.min(4, barW / 2, barH);
                const yTop = PAD.top + plotH - barH;
                const isToday = i === data.length - 1;
                const path =
                  barH > 0
                    ? `M${x},${PAD.top + plotH} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${PAD.top + plotH} Z`
                    : "";
                return (
                  <g
                    key={d.date}
                    tabIndex={0}
                    role="img"
                    aria-label={`${dayLabel(d.date)}: ${formatBDT(d.sales)}, ${d.orders} orders`}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="outline-none"
                  >
                    <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="transparent" />
                    {path && (
                      <path
                        d={path}
                        fill={isToday ? ACCENT : INK}
                        opacity={hover === null || hover === i ? 1 : 0.35}
                        className="transition-opacity"
                      />
                    )}
                    {i % labelEvery === (data.length - 1) % labelEvery && (
                      <text x={PAD.left + i * band + band / 2} y={H - 10} textAnchor="middle" fontSize={11} fill={MUTED}>
                        {isToday ? "Today" : dayLabel(d.date)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {h && hover !== null && (
            <div
              className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs shadow-lg"
              style={{
                left: Math.min(Math.max(PAD.left + hover * band + band / 2, 80), width - 80),
                top: Math.max(0, y(h[metric]) - 72),
              }}
            >
              <p className="text-ink/55">{hover === data.length - 1 ? "Today" : dayLabel(h.date)}</p>
              <p className="mt-0.5 text-base font-bold text-ink">{money ? formatBDT(h.sales) : `${h.orders} orders`}</p>
              <p className="text-ink/55">{money ? `${h.orders} orders` : formatBDT(h.sales)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
