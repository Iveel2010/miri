"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-client";
import { pusherClientEnabled } from "@/hooks/use-realtime";

const NAV_ITEMS = [
  { href: "/admin", label: "Хянах самбар", icon: DashboardIcon },
  { href: "/admin/artworks", label: "Бүтээлүүд", icon: ArtworkIcon },
  { href: "/admin/artists", label: "Уран зураачид", icon: ArtistIcon },
  { href: "/admin/categories", label: "Ангилал", icon: CategoryIcon },
  { href: "/admin/content", label: "Агуулга", icon: ContentIcon },
  { href: "/admin/purchase-requests", label: "Худалдан авах хүсэлтүүд", icon: PurchaseRequestIcon },
  { href: "/admin/contact-messages", label: "Зурвасууд", icon: ContactIcon },
];

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function ArtworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L3 21" />
    </svg>
  );
}

function ArtistIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CategoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function ContentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function PurchaseRequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ContactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12h10M17 9l3 3-3 3" />
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  const addToast = useCallback((message: string, type = "info") => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/login?next=/admin");
    }
  }, [user, status, router]);

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

      channelInstance.bind("new-purchase-request", () => {
        addToast("Шинэ худалдан авах хүсэлт ирлээ!", "purchase");
      });

      channelInstance.bind("new-contact-message", () => {
        addToast("Шинэ зурвас ирлээ!", "contact");
      });

      channelInstance.bind("new-order", () => {
        addToast("Шинэ захиалга бүртгэгдлээ!", "order");
      });
    };

    init();

    return () => {
      if (channelInstance && pusher) {
        channelInstance.unbind_all?.();
        pusher.unsubscribe("private-admin");
        pusher.disconnect();
      }
    };
  }, [addToast]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-accent text-white shadow-sm shadow-accent/30"
                : "text-primary/70 hover:bg-accent/5 hover:text-accent"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (status === "loading" || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-3 px-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white text-sm font-bold shadow-sm">
            А
          </span>
          <span className="font-display text-lg font-bold text-primary">Админ</span>
        </div>
        {nav}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
              {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{user.name ?? "Админ"}</p>
              <p className="truncate text-xs text-primary/50">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary/70 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogoutIcon className="h-5 w-5" />
              Гарах
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white text-sm font-bold">
                  А
                </span>
                <span className="font-display text-lg font-bold text-primary">Админ</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-primary/60">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {nav}
              <div className="border-t border-border p-3">
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary/70 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogoutIcon className="h-5 w-5" />
                    Гарах
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-border p-2 text-primary/70 md:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-primary md:text-xl">
                {NAV_ITEMS.find((i) => isActive(i.href))?.label ?? "Админ самбар"}
              </h1>
              <p className="hidden text-xs text-primary/50 sm:block">Miry уран бүтээлийн удирдлага</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium text-primary/70 transition-colors hover:bg-accent/5 hover:text-accent sm:inline-flex"
            >
              Сайт харах
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
              {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="animate-in slide-in-from-bottom-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
            >
              <p className="text-sm font-medium text-primary">{toast.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
