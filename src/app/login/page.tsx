"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
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
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Нэвтрэхэд алдаа гарлаа.";
      if (msg.toLowerCase().includes("invalid credentials")) {
        setErrors({ general: "Имэйл эсвэл нууц үг буруу байна." });
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes("password")) {
        setErrors({ password: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    const validationErrors = validate();
    setErrors((prev) => ({ ...prev, [field]: validationErrors[field as keyof FieldErrors] }));
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr,1.2fr] lg:gap-12">
        {/* Left panel */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white text-2xl font-display shadow-lg shadow-accent/20">
            М
          </div>
          <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
            Дахин тавтай<br />
            <span className="text-accent">морь, Мири!</span>
          </h1>
          <p className="mt-4 max-w-sm text-balance text-primary/60 leading-relaxed">
            Хадгалсан бүтээл, хүсэлт, мэдээлэл — өөрийн талаар бүгдийг хадгалж хэрэглэхэд зориулагдсан.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-primary/40">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
            24/7 найдвартай үйлчилгээ
          </div>
        </div>

        {/* Right panel */}
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
          <header className="mb-8">
            <h2 className="font-display text-2xl font-bold text-primary">Нэвтрэх</h2>
            <p className="mt-1 text-sm text-primary/60">Өөрийн танд хайх, худалдах, хадгалах.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-primary/70">
                Имэйл
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="your@email.com"
                autoComplete="email"
                aria-invalid={!!errors.email && touched.has("email")}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                  errors.email && touched.has("email") ? "border-red-400" : "border-border"
                }`}
              />
              {errors.email && touched.has("email") && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-primary/70">
                Нууц үг
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password && touched.has("password")}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                    errors.password && touched.has("password") ? "border-red-400" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
                  className="absolute inset-y-0 right-2 flex items-center px-2 text-primary/50 transition-colors hover:text-accent"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                      <line x1="3" y1="3" x2="21" y2="21" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && touched.has("password") && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-primary/70">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Нууц үг харуулах
              </label>
              <label className="flex items-center gap-2 text-primary/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Намайг сана
              </label>
              <Link href="/forgot-password" className="text-accent hover:underline">
                Нууц үг мартсан?
              </Link>
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

          <div className="mt-6 text-center text-sm text-primary/60">
            Бүртгэлгүй юу?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
