"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPost, ApiError } from "@/lib/api-client";
import { Button } from "@/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-24">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-primary">Нууц үг сэргээх</h1>
        <p className="mt-2 text-sm text-primary/60">
          Имэйл хаягаа оруул. Бид танд сэргээх холбоос илгээх болно.
        </p>
      </header>

      {sent ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-primary/70">
          Хэрэв энэ имэйл бүртгэлтэй байвал танд сэргээх холбоос илгээгдсэн.
          <div className="mt-4">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Нэвтрэх рүү буцах
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Имэйл"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Илгээж байна…" : "Холбоос илгээх"}
          </Button>
        </form>
      )}
    </section>
  );
}
