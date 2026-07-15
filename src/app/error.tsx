"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the underlying cause server-side for debugging.
    // eslint-disable-next-line no-console
    console.error("Page error boundary caught:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-2xl text-accent shadow-sm">
        ✦
      </span>
      <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">
        Ямар нэгэн алдаа гарлаа
      </h1>
      <p className="mt-4 max-w-md text-primary/60">
        Хуудсыг ачааллахад алдаа гарлаа. Дахин оролдож үзнэ үү эсвэл мөн л
        хоромхон хүлээгээд шинэчлээрэй.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset} size="lg">
          Дахин оролдох
        </Button>
        <Button href="/" variant="secondary" size="lg">
          Нүүр хуудас
        </Button>
      </div>
    </section>
  );
}
