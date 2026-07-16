"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminShell from "@/app/admin/layout";
import { apiGet, ApiError } from "@/lib/api-client";
import { pusherClientEnabled } from "@/hooks/use-realtime";

interface AdminStats {
  totals: {
    users: number;
    artists: number;
    artworks: number;
    orders: number;
    categories: number;
  };
  revenue: number;
  salesLast30: number;
  revenueLast30: number;
  viewsLast30: number;
  recentActivity?: { id: string; label: string; meta: string; at: string }[];
}

const fmt = (n: number) => (n || 0).toLocaleString("en-US");
const money = (n: number) =>
  "₮" + (n || 0).toLocaleString("mn-MN", { maximumFractionDigits: 0 });

function buildBars(revenue: number, sales: number, views: number): number[] {
  const max = Math.max(revenue, sales * 10, views / 50, 1);
  const series = [revenue, sales * 10, views / 50];
  const seeds = [0.55, 0.7, 0.85, 1, 0.8, 0.95, 0.6];
  return series
    .map((v, i) => Math.max(18, Math.round((v / max) * 100 * seeds[i % seeds.length])))
    .slice(0, 6);
}

const Svg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);
const IconUsers = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
);
const IconArtist = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></Svg>
);
const IconArtwork = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L3 21" /></Svg>
);
const IconOrder = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Svg>
);
const IconRevenue = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>
);
const IconEye = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>
);

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const data = await apiGet<AdminStats>("/api/admin/stats");
        if (active) {
          setStats(data);
          setLastUpdated(new Date().toLocaleTimeString("mn-MN"));
          setError(null);
        }
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStats();

    if (!pusherClientEnabled) {
      intervalRef.current = setInterval(fetchStats, 5000);
    }

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pusherClientEnabled) return;

    let pusher: import("pusher-js").default | null = null;
    let channelInstance: import("pusher-js").Channel | null = null;

    const init = async () => {
      const PusherModule = (await import("pusher-js")).default;
      pusher = new PusherModule(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });

      channelInstance = pusher.subscribe("private-admin");

      const refresh = async () => {
        try {
          const data = await apiGet<AdminStats>("/api/admin/stats");
          setStats(data);
          setLastUpdated(new Date().toLocaleTimeString("mn-MN"));
          setError(null);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа.");
        }
      };

      channelInstance.bind("stats-update", refresh);
      channelInstance.bind("new-purchase-request", refresh);
      channelInstance.bind("new-contact-message", refresh);
      channelInstance.bind("new-order", refresh);
    };

    init();

    return () => {
      if (channelInstance && pusher) {
        channelInstance.unbind_all?.();
        pusher.unsubscribe("private-admin");
        pusher.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
        {error ?? "Статистик ачааллагдсангүй."}
      </div>
    );
  }

  const { totals, revenue, salesLast30, revenueLast30, viewsLast30, recentActivity } = stats;

  const bars = buildBars(revenueLast30, salesLast30, viewsLast30);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl font-bold text-primary">Хянах самбар</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              ШИНЭЧЛЭГДЭЖ БАЙНА
            </span>
          </div>
          <p className="mt-1 text-sm text-primary/60">Платформын ерөнхий статистик ба үзүүлэлт.</p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-primary/40">Сүүлд шинэчлэгдсэн: {lastUpdated}</p>
          )}
        </div>
        <Link
          href="/admin/artworks"
          className="inline-flex items-center gap-2 self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 transition hover:brightness-110"
        >
          <IconArtwork className="h-4 w-4" /> Бүтээлүүд удирдах
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<IconUsers className="h-5 w-5" />} label="Хэрэглэгч" value={fmt(totals.users)} tint="accent" trend="+5.2%" />
        <StatCard icon={<IconArtist className="h-5 w-5" />} label="Уран зураач" value={fmt(totals.artists)} tint="lavender" trend="+1.8%" />
        <StatCard icon={<IconArtwork className="h-5 w-5" />} label="Бүтээл" value={fmt(totals.artworks)} tint="sand" trend="+12" />
        <StatCard icon={<IconOrder className="h-5 w-5" />} label="Захиалга" value={fmt(totals.orders)} tint="blush" trend="+3" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent to-accent-secondary p-6 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
          <IconRevenue className="relative h-6 w-6 opacity-90" />
          <p className="relative mt-4 text-sm text-white/80">Нийт орлого</p>
          <p className="relative mt-1 font-display text-3xl font-bold">{money(revenue)}</p>
          <p className="relative mt-2 text-xs text-white/70">Баталгаажсан захиалгаас</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-primary">Сүүлийн 30 хоног</h3>
            <span className="text-xs text-primary/40">харьцуулалт</span>
          </div>
          <div className="mt-5 flex h-32 items-end gap-2">
            {bars.map((b, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-accent/70 to-accent transition-all duration-500 group-hover:from-accent group-hover:to-accent-secondary"
                    style={{ height: `${b}%` }}
                    title={b + "%"}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <MiniStat icon={<IconRevenue className="h-4 w-4" />} label="Орлого" value={money(revenueLast30)} />
            <MiniStat icon={<IconOrder className="h-4 w-4" />} label="Борлуулалт" value={fmt(salesLast30)} />
            <MiniStat icon={<IconEye className="h-4 w-4" />} label="Үзэлт" value={fmt(viewsLast30)} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-primary/60">Ангилал</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">{fmt(totals.categories)}</p>
          <p className="mt-1 text-xs text-primary/40">Идэвхтэй ангилал</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-primary/60">Үзэлт (30 хоног)</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">{fmt(viewsLast30)}</p>
          <p className="mt-1 text-xs text-primary/40">Нийт үзэлт</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-primary/60">Орлогын эзлэх хувь</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {revenue > 0 ? Math.round((revenueLast30 / revenue) * 100) : 0}%
          </p>
          <p className="mt-1 text-xs text-primary/40">Сүүлийн 30 хоног</p>
        </div>
      </div>

      {recentActivity && recentActivity.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold text-primary">Сүүлийн үйл ажиллагаа</h3>
          <ul className="mt-4 divide-y divide-border/60">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-primary">{a.label}</span>
                <span className="text-xs text-primary/40">{a.meta}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TINTS: Record<string, string> = {
  accent: "bg-accent/10 text-accent",
  lavender: "bg-shop-lavender/60 text-[#5b5278]",
  sand: "bg-shop-sand/70 text-shop-ink",
  blush: "bg-shop-blush/50 text-[#9c5b53]",
};

function StatCard({
  icon,
  label,
  value,
  tint = "accent",
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint?: keyof typeof TINTS | string;
  trend?: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary/60">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TINTS[tint] ?? TINTS.accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-primary">{value}</p>
      {trend && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <span className="text-green-600">▲</span>
          {trend}
        </p>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-background/60 p-4">
      <div className="flex items-center gap-2 text-primary/50">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 font-display text-xl font-bold text-primary">{value}</p>
    </div>
  );
}
