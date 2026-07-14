"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiPost, ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Хүчингүй эсвэл хугацаа дууссан токен.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost("/api/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-24">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Шинэ нууц үг</h1>
      </header>

      {done ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-primary/70">
          Нууц үг шинэчлэгдлээ. Нэвтрэх хуудас руу шилжүүлж байна…
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Шинэ нууц үг (8+ тэмдэгт)"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
          <p className="text-center text-sm text-primary/60">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Нэвтрэх рүү буцах
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
