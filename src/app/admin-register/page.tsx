"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

type Role = "ADMIN" | "ARTIST" | "CUSTOMER";

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Админ" },
  { value: "ARTIST", label: "Уран зураач" },
  { value: "CUSTOMER", label: "Цуглуулагч" },
];

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  inviteCode?: string;
  general?: string;
};

// Hidden admin sign-up. Not linked anywhere in the UI — only reachable with a
// known URL AND a valid ADMIN_INVITE_CODE. Used to mint the first admin (and
// other) accounts without exposing public registration.
export default function AdminRegisterPage() {
  const { adminRegister } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback(() => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Нэр шаардлагатай.";
    if (!email.trim()) next.email = "Имэйл шаардлагатай.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Имэйл хаягийн форматад таарахгүй байна.";
    if (!password) next.password = "Нууц үг шаардлагатай.";
    else if (password.length < 8) next.password = "Нууц үг 8+ тэмдэгттэй байх ёстой.";
    if (!inviteCode.trim()) next.inviteCode = "Покан код шаардлагатай.";
    return next;
  }, [name, email, password, inviteCode]);

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
      await adminRegister({ name, email, password, role, inviteCode });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Бүртгэлтэй алдаа гарлаа.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-24">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
        <header className="mb-8">
          <h2 className="font-display text-2xl font-bold text-primary">Нууц бүртгэл</h2>
          <p className="mt-1 text-sm text-primary/60">Зөвхөн админ бүртгэлд зориулагдсан.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-primary/70">Нэр</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Таны нэр"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-primary/70">Имэйл</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-primary/70">Нууц үг</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-primary/70">Покан код</label>
            <input
              id="inviteCode"
              type="password"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-primary/30 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
            {errors.inviteCode && <p className="text-xs text-red-500">{errors.inviteCode}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-primary/70">Дүрэм</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-2xl border-2 p-3 text-sm font-semibold transition-all duration-300 ${
                    role === r.value
                      ? "border-accent bg-accent/5 text-primary"
                      : "border-border text-primary/70 hover:border-accent/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {errors.general && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full !py-3.5 text-base">
            {loading ? "Түр хүлээнэ үү…" : "Бүртгүүлэх"}
          </Button>
        </form>
      </div>
    </section>
  );
}
