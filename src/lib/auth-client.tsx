"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ApiUser } from "@/types/api";
import { apiGet, apiPost, onUnauthorized } from "@/lib/api-client";

// ============================================================================
// Client-side auth context. The JWT lives in an httpOnly cookie, so we can
// only learn auth state by calling /api/auth/me. This provider exposes the
// current user and login/register/logout actions to the whole app.
// ============================================================================

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: ApiUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<ApiUser | null>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "ARTIST" | "CUSTOMER";
  }) => Promise<void>;
  adminRegister: (input: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "ARTIST" | "CUSTOMER";
    inviteCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async () => {
    try {
      const me = await apiGet<ApiUser>("/api/auth/me");
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // Reset state on forced logout (401).
    const off = onUnauthorized(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
    return off;
  }, [load]);

  const login = useCallback(
    async (email: string, password: string) => {
      const me = await apiPost<ApiUser>("/api/auth/login", { email, password });
      await load();
      return me;
    },
    [load],
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role?: "ADMIN" | "ARTIST" | "CUSTOMER";
    }) => {
      await apiPost("/api/auth/register", input);
      await load();
    },
    [load],
  );

  const adminRegister = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      role?: "ADMIN" | "ARTIST" | "CUSTOMER";
      inviteCode: string;
    }) => {
      await apiPost("/api/auth/admin-register", input);
      await load();
    },
    [load],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // ignore logout errors (e.g. expired token) and clear local state anyway
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      router.push("/");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, status, login, register, adminRegister, logout, refresh: load }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
