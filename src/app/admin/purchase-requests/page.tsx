"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import type { ApiPurchaseRequestList } from "@/types/api";
import Reveal from "@/components/Reveal";

const STATUS_OPTIONS = [
  { value: "", label: "Бүгд" },
  { value: "NEW", label: "Шинэ" },
  { value: "CONTACTED", label: "Холбогдсон" },
  { value: "RESERVED", label: "Нөөцлөгдсөн" },
  { value: "SOLD", label: "Борлогдсон" },
  { value: "CANCELLED", label: "Цуцлагдсан" },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "сая";
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг өмнө`;
  return `${Math.floor(h / 24)} өдөр өмнө`;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  NEW: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20", dot: "bg-accent" },
  CONTACTED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  RESERVED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  SOLD: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Шинэ",
  CONTACTED: "Холбогдсон",
  RESERVED: "Нөөцлөгдсөн",
  SOLD: "Борлогдсон",
  CANCELLED: "Цуцлагдсан",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? { bg: "bg-shop-sand/70", text: "text-shop-ink", border: "border-shop-sand", dot: "bg-shop-ink" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.bg} ${style.text} border ${style.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ActionButton({
  onClick,
  children,
  variant = "ghost",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "ghost" | "primary" | "danger";
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200";
  const variants = {
    ghost: "border border-border text-primary/70 hover:border-primary/30 hover:text-primary hover:bg-primary/5",
    primary: "bg-accent text-white hover:brightness-110 shadow-sm shadow-accent/20",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

export default function AdminPurchaseRequestsPage() {
  const { status } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ApiPurchaseRequestList | null>(null);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!data) return { total: 0, new: 0, contacted: 0, reserved: 0, sold: 0, cancelled: 0 };
    return {
      total: data.items.length,
      new: data.items.filter((i) => i.status === "NEW").length,
      contacted: data.items.filter((i) => i.status === "CONTACTED").length,
      reserved: data.items.filter((i) => i.status === "RESERVED").length,
      sold: data.items.filter((i) => i.status === "SOLD").length,
      cancelled: data.items.filter((i) => i.status === "CANCELLED").length,
    };
  }, [data]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const tick = () => {
      const sp = new URLSearchParams();
      if (statusFilter) sp.set("status", statusFilter);
      apiGet<ApiPurchaseRequestList>(`/api/admin/purchase-requests?${sp.toString()}`)
        .then((d) => active && (setData(d), setError(false)))
        .catch(() => active && setError(true));
    };
    tick();
    const t = setInterval(tick, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [status, statusFilter]);

  if (status === "loading") {
    return (
      <section className="px-6 pb-24 pt-40">
        <div className="mx-auto max-w-3xl text-center text-primary/60">Ачаалж байна…</div>
      </section>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login?next=/admin/purchase-requests");
    return (
      <section className="px-6 pb-24 pt-40">
        <div className="mx-auto max-w-3xl text-center text-primary/60">
          Нэвтрэх хуулж байна…
        </div>
      </section>
    );
  }

  const refresh = () => {
    const sp = new URLSearchParams();
    if (statusFilter) sp.set("status", statusFilter);
    apiGet<ApiPurchaseRequestList>(`/api/admin/purchase-requests?${sp.toString()}`)
      .then((d) => (setData(d), setError(false)))
      .catch(() => setError(true));
  };

  const updateStatus = async (id: string, newStatus: "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED") => {
    try {
      await apiPatch(`/api/admin/purchase-requests/${id}`, { status: newStatus });
      refresh();
    } catch {
      /* swallow */
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Энэ хүсэлтийг устгахдаа итгэлтэй байна уу?")) return;
    try {
      await apiDelete(`/api/admin/purchase-requests/${id}`);
      refresh();
    } catch {
      /* swallow */
    }
  };

  const copyPhone = async (phone: string, id: string) => {
    await navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section className="px-6 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                Gallery Management
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
                Худалдан авах хүсэлтүүд
              </h1>
              <p className="mt-4 text-balance text-primary/60">
                Collectors and visitors requesting to purchase your artworks.
                Auto-refreshes every 8 seconds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-primary/60">Live</span>
            </div>
          </div>
        </Reveal>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
            Хүсэлтүүдийг ачааллахад алдаа гарлаа.
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Бүгд", value: stats.total, color: "bg-primary/5 text-primary" },
            { label: "Шинэ", value: stats.new, color: "bg-accent/10 text-accent" },
            { label: "Холбогдсон", value: stats.contacted, color: "bg-blue-50 text-blue-700" },
            { label: "Нөөцлөгдсөн", value: stats.reserved, color: "bg-amber-50 text-amber-700" },
            { label: "Борлогдсон", value: stats.sold, color: "bg-emerald-50 text-emerald-700" },
            { label: "Цуцлагдсан", value: stats.cancelled, color: "bg-red-50 text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className={`mt-1 text-xs font-medium ${stat.color} rounded-full inline-block px-2 py-0.5`}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-full border border-border bg-card pl-4 pr-10 py-2 text-sm outline-none focus:border-accent transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {data && data.items.length === 0 && (
            <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-2xl text-primary/40">
                ✦
              </div>
              <p className="text-sm font-medium text-primary/60">Одоогоор хүсэлт байхгүй байна.</p>
              <p className="mt-1 text-xs text-primary/40">Шинэ хүсэлтүүд энд автоматаар гарч ирнэ.</p>
            </div>
          )}

          {data?.items.map((req) => (
            <div
              key={req.id}
              className={`group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-accent/5 ${
                req.status === "NEW" ? "border-accent/30" : "border-border"
              }`}
            >
              <div className="flex items-start gap-4 sm:gap-5">
                {req.artwork && (
                  <Link href={`/artwork/${req.artwork.id}`} target="_blank" rel="noopener noreferrer" className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background">
                    <img
                      src={optimizeCloudinaryUrl(req.artwork.image)}
                      alt={req.artwork.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-primary">{req.buyerName}</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  {req.artwork && (
                    <Link href={`/artwork/${req.artwork.id}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-accent transition-colors hover:text-accent/80 hover:underline">
                      <span className="font-medium">«{req.artwork.title}»</span> бүтээлээр
                    </Link>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <a href={`tel:${req.buyerPhone}`} className="inline-flex items-center gap-1.5 text-accent transition-colors hover:text-accent/80">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {req.buyerPhone}
                    </a>
                    {req.buyerEmail && (
                      <a href={`mailto:${req.buyerEmail}`} className="inline-flex items-center gap-1.5 text-primary/60 transition-colors hover:text-accent">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {req.buyerEmail}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => copyPhone(req.buyerPhone, req.id)}
                      className="inline-flex items-center gap-1.5 text-primary/50 transition-colors hover:text-primary"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copiedId === req.id ? "Хуулагдлаа" : "Хуулах"}
                    </button>
                  </div>
                  {req.message && (
                    <p className="mt-3 rounded-xl bg-background/60 px-4 py-3 text-sm leading-relaxed text-primary/70 italic">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {req.status === "NEW" && (
                      <>
                        <ActionButton variant="primary" onClick={() => updateStatus(req.id, "CONTACTED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Холбогдсон
                        </ActionButton>
                        <ActionButton onClick={() => updateStatus(req.id, "RESERVED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Нөөцлөх
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => updateStatus(req.id, "CANCELLED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Цуцлах
                        </ActionButton>
                      </>
                    )}
                    {req.status === "CONTACTED" && (
                      <>
                        <ActionButton onClick={() => updateStatus(req.id, "RESERVED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Нөөцлөх
                        </ActionButton>
                        <ActionButton variant="primary" onClick={() => updateStatus(req.id, "SOLD")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Борлуулах
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => updateStatus(req.id, "CANCELLED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Цуцлах
                        </ActionButton>
                      </>
                    )}
                    {req.status === "RESERVED" && (
                      <>
                        <ActionButton variant="primary" onClick={() => updateStatus(req.id, "SOLD")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Борлуулах
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => updateStatus(req.id, "CANCELLED")}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Цуцлах
                        </ActionButton>
                      </>
                    )}
                    <ActionButton onClick={() => deleteRequest(req.id)}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Устгах
                    </ActionButton>
                  </div>
                </div>
                <div className="shrink-0 pt-1 text-right">
                  <p className="text-xs text-primary/40">{timeAgo(req.createdAt)}</p>
                  <p className="mt-1 text-[10px] text-primary/30">
                    {new Date(req.createdAt).toLocaleDateString("mn-MN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
