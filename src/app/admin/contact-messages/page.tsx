"use client";

import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "@/lib/api-client";
import type { ApiContactMessageList } from "@/types/api";
import Reveal from "@/components/Reveal";
import { pusherClientEnabled } from "@/hooks/use-realtime";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "сая";
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг өмнө`;
  return `${Math.floor(h / 24)} өдөр өмнө`;
}

export default function AdminContactMessagesPage() {
  const [data, setData] = useState<ApiContactMessageList | null>(null);
  const [error, setError] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const refresh = () => {
    apiGet<ApiContactMessageList>("/api/admin/contact-messages")
      .then((d) => (setData(d), setError(false)))
      .catch(() => setError(true));
  };

  useEffect(() => {
    refresh();

    if (pusherClientEnabled) {
      let pusher: import("pusher-js").default | null = null;
      let channelInstance: import("pusher-js").Channel | null = null;

      const init = async () => {
        const PusherModule = (await import("pusher-js")).default;
        pusher = new PusherModule(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });
        channelInstance = pusher.subscribe("private-admin");

        channelInstance.bind("new-contact-message", () => {
          refresh();
        });
      };

      init();

      return () => {
        if (channelInstance && pusher) {
          channelInstance.unbind("new-contact-message");
          pusher.unsubscribe("private-admin");
          pusher.disconnect();
        }
      };
    }

    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const deleteMessage = async (id: string) => {
    if (!confirm("Энэ зурвасыг устгахдаа итгэлтэй байна уу?")) return;
    try {
      await apiDelete(`/api/admin/contact-messages/${id}`);
      refresh();
    } catch {
      /* swallow */
    }
  };

  const copyEmail = async (email: string, id: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 1500);
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
                Зурвасууд
              </h1>
              <p className="mt-4 text-balance text-primary/60">
                Ирсэн зурвасуудыг энд харах боломжтой. Шинэ зурвас ирэхэд автоматаар шинэчлэнэ.
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
            Зурвасуудыг ачааллахад алдаа гарлаа.
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Бүгд", value: data?.meta.total ?? 0, color: "bg-primary/5 text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className={`mt-1 text-xs font-medium ${stat.color} rounded-full inline-block px-2 py-0.5`}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {data && data.items.length === 0 && (
            <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-2xl text-primary/40">
                ✦
              </div>
              <p className="text-sm font-medium text-primary/60">Одоогоор зурвас байхгүй байна.</p>
              <p className="mt-1 text-xs text-primary/40">Шинэ зурвас ирэхэд энд автоматаар гарч ирнэ.</p>
            </div>
          )}

          {data?.items.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-accent/5"
            >
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg font-bold text-accent">
                  {(msg.name.charAt(0) ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-primary">{msg.name}</h3>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                      {new Date(msg.createdAt).toLocaleDateString("mn-MN")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <a href={`mailto:${msg.email}`} className="inline-flex items-center gap-1.5 text-accent transition-colors hover:text-accent/80">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {msg.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyEmail(msg.email, msg.id)}
                      className="inline-flex items-center gap-1.5 text-primary/50 transition-colors hover:text-primary"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copiedEmail === msg.id ? "Хуулагдлаа" : "Хуулах"}
                    </button>
                  </div>
                  {msg.subject && (
                    <p className="mt-2 text-sm font-medium text-primary/80">
                      <span className="text-primary/40">Сэдэв:</span> {msg.subject}
                    </p>
                  )}
                  <p className="mt-2 rounded-xl bg-background/60 px-4 py-3 text-sm leading-relaxed text-primary/70">
                    {msg.body}
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => deleteMessage(msg.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Устгах
                    </button>
                  </div>
                </div>
                <div className="shrink-0 pt-1 text-right">
                  <p className="text-xs text-primary/40">{timeAgo(msg.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
