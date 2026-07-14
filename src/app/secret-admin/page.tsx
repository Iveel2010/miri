"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

// Hidden admin login. Not linked anywhere in the UI — only reachable via the
// secret URL (/secret-admin). Admins log in here with email + password.
export default function SecretAdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = useCallback(() => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Имэйл шаардлагатай.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Имэйл хаягийн форматад таарахгүй байна.";
    if (!password) next.password = "Нууц үг шаардлагатай.";
    return next;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const me = await login(email, password);
      if (me?.role !== "ADMIN") {
        setErrors({ general: "Зөвхөн админ эрхтэй хэрэглэгч нэвтэрч чадна." });
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Нэвтрэхэд алдаа гарлаа.";
      if (msg.toLowerCase().includes("invalid credentials")) {
        setErrors({ general: "Имэйл эсвэл нууц үг буруу байна." });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-24">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
        <header className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white text-xl font-bold shadow-lg shadow-accent/20">
            А
          </div>
          <h2 className="font-display text-2xl font-bold text-primary">Админ нэвтрэх</h2>
          <p className="mt-1 text-sm text-primary/60">Зөвхөн админ хэрэглэгчдэд зориулагдсан.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-primary/70">Имэйл</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="email"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-primary/70">Нууц үг</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-primary/40 transition-colors hover:text-primary"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {errors.general && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full !py-3.5 text-base">
            {loading ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
          </Button>
        </form>
      </div>
    </section>
  );
}
