"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";

// Auth controls shown in the navbar (desktop + mobile). Reads auth state from
// the client AuthProvider; the JWT cookie is httpOnly so we only reflect
// whatever /api/auth/me reported.
export function NavbarAuth({ className }: { className?: string }) {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return (
      <span
        className={`h-9 w-20 animate-pulse rounded-full bg-accent/10 ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  if (status === "authenticated") {
    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <span className="text-sm font-medium text-primary/70">{user?.name}</span>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm font-medium text-primary/50 transition-colors hover:text-accent"
        >
          Гарах
        </button>
      </div>
    );
  }

  // Unauthenticated visitors see Login + Sign up entry points.
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Link
        href="/login"
        className="text-sm font-medium text-primary/70 transition-colors hover:text-accent"
      >
        Нэвтрэх
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-accent/30"
      >
        Бүртгүүлэх
      </Link>
    </div>
  );
}
