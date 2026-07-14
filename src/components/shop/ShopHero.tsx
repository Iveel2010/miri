"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button";

export default function ShopHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const caption = captionRef.current;
    if (!section || !image || !caption) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const progress = Math.min(
          Math.max(-rect.top / window.innerHeight, 0),
          1
        );
        image.style.transform = `translate3d(0, ${progress * 18}%, scale(1.12))`;
        caption.style.transform = `translate3d(0, ${progress * -40}px, 0)`;
        caption.style.opacity = `${1 - progress * 1.4}`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[92vh] min-h-[640px] items-end overflow-hidden bg-shop-ink"
    >
      <div
        ref={imageRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1549490347441-7783f6c6a0c8?auto=format&fit=crop&w=2000&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(1.12)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-shop-ink/85 via-shop-ink/20 to-shop-ink/10" />

      <div
        ref={captionRef}
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 md:pb-28"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-shop-blush">
          MIRI collection
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-bold leading-[1.02] text-white sm:text-7xl md:text-8xl">
          Онцгой бүтээлүүд
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
          MIRI-ийн хамгийн онцгой бүтээлүүдтэй танилцаарай. Энд зөвхөн цөөн
          тоогоор бүтээсэн, дахин давтагдахгүй болон Limited Edition бүтээлүүдийг
          танилцуулдаг. Зураг бүр өөрийн гэсэн үнэ цэнэ, түүх, мэдрэмжийг
          хадгалсан байдаг…
        </p>
        <div className="mt-9">
          <Button href="#collection" size="lg" variant="light">
            бүх зураг
            <span aria-hidden="true">&rarr;</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
