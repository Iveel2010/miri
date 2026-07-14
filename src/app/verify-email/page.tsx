"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api-client";

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Баталгаажуулах токен олдсонгүй.");

  useEffect(() => {
    if (!token) return;
    apiGet(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus("ok");
        setMessage("Имэйл амжилттай баталгаажлаа. Та одоо бүх боломжоор ашиглаж болно.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Баталгаажуулалт амжилтгүй боллоо.");
      });
  }, [token]);

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-primary">Имэйл баталгаажуулалт</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-primary/70">
        {status === "loading" && "Баталгаажуулж байна…"}
        {status !== "loading" && message}
      </div>
      <div className="mt-6">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Нэвтрэх рүү
        </Link>
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageInner />
    </Suspense>
  );
}
