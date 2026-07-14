"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

type Role = "CUSTOMER" | "ARTIST";

const ROLES: { value: Role; label: string; description: string; emoji: string }[] = [
  {
    value: "CUSTOMER",
    label: "Цуглуулагч",
    description: "Уран бүтээл худалдан авах, хадгалах, үнэлгээ өгөх",
    emoji: "🖼️",
  },
  {
    value: "ARTIST",
    label: "Уран зураач",
    description: "Бүтээлээ нийтлэх, үйлчлүүлэгчтэйгээ холбогдох",
    emoji: "🎨",
  },
];

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validate = useCallback(() => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Нэр шаардлагатай.";
    if (!email.trim()) next.email = "Имэйл шаардлагатай.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Имэйл хаягийн форматад таарахгүй байна.";
    if (!password) next.password = "Нууц үг шаардлагатай.";
    else if (password.length < 8) next.password = "Нууц үг 8+ тэмдэгттэй байх ёстой.";
    return next;
  }, [name, email, password]);

  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  })();

  const strengthLabel = passwordStrength === 0 ? "" : passwordStrength <= 1 ? "Доод" : passwordStrength <= 2 ? "Дунд" : passwordStrength <= 3 ? "Сайн" : "Маш сайн";
  const strengthColor = passwordStrength <= 1 ? "bg-red-400" : passwordStrength <= 2 ? "bg-orange-400" : passwordStrength <= 3 ? "bg-yellow-400" : "bg-green-500";

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
      await register({ name, email, password, role });
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Бүртгэлтэй алдаа гарлаа.";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("already")) {
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
    if (field === "name" || field === "email" || field === "password") {
      const validationErrors = validate();
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field as keyof FieldErrors] }));
    }
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center px-6 py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr,1.2fr] lg:gap-12">
        {/* Left panel — Brand / Illustration */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white text-2xl font-display shadow-lg shadow-accent/20">
            М
          </div>
          <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
            Уран бүтээлний<br />
            <span className="text-accent">шинэ ертөнц</span>
          </h1>
          <p className="mt-4 max-w-sm text-balance text-primary/60 leading-relaxed">
            Миний уран бүтээл сайт явж буйгээр сэтгэмжтэй. Та маань цуглуулагч эсвэл оруулагч гэсэн 2 өөр замаар орж тавтай морилно уу.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-primary/40">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
            Бүртгэл нэмэгдэх бүртгэлтэй байнгын шинэчлэгдэж буй
          </div>
        </div>

        {/* Right panel — Registration form */}
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
          <header className="mb-8">
            <h2 className="font-display text-2xl font-bold text-primary">Бүртгүүлэх</h2>
            <p className="mt-1 text-sm text-primary/60">Miry-д нэгдэхээ бэлтгэл үүсгээд байгаарай.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-primary/70">
                Нэр
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Таны нэр"
                aria-invalid={!!errors.name && touched.has("name")}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                  errors.name && touched.has("name") ? "border-red-400" : "border-border"
                }`}
              />
              {errors.name && touched.has("name") && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
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
                aria-invalid={!!errors.email && touched.has("email")}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                  errors.email && touched.has("email") ? "border-red-400" : "border-border"
                }`}
              />
              {errors.email && touched.has("email") && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-primary/70">
                Нууц үг
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••"
                aria-invalid={!!errors.password && touched.has("password")}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                  errors.password && touched.has("password") ? "border-red-400" : "border-border"
                }`}
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          bar <= passwordStrength ? strengthColor : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-primary/40">
                    Нууц үгийн хүчилтэл: {strengthLabel}
                  </p>
                </div>
              )}
              {errors.password && touched.has("password") && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary/70">Та хэн үү?</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                      role === r.value
                        ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                        : "border-border hover:border-accent/40 hover:bg-accent/[0.03]"
                    }`}
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <span className="mt-2 block text-sm font-semibold text-primary">{r.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-primary/50">
                      {r.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.general}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full !py-3.5 text-base">
              {loading ? "Түр хүлээнэ үү…" : "Бүртгүүлэх"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-primary/60">
            Бүртгэлтэй юу?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
