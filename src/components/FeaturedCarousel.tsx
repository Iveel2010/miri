"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import type { ApiArtwork } from "@/types/api";

interface FeaturedCarouselProps {
  items: ApiArtwork[];
}

export default function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const SPACING = 0.2;
    const CARD_SNAP = gsap.utils.snap(SPACING);
    const CARDS = gsap.utils.toArray<HTMLElement>(".card", root);

    const buildLoop = (cards: HTMLElement[], spacing: number) => {
      const OVERLAP = Math.ceil(1 / spacing);
      const START = cards.length * spacing + 0.5;
      const LOOP_TIME = (cards.length + OVERLAP * 2) * spacing + 1;
      const RAW = gsap.timeline({ paused: true });
      const LOOP = gsap.timeline({ paused: true, repeat: -1 });
      const L = cards.length + OVERLAP * 2;
      let time = 0;

      gsap.set(cards, { xPercent: 5000, opacity: 0, scale: 0 });

      for (let i = 0; i < L; i++) {
        const index = i % cards.length;
        const item = cards[index];
        time = i * spacing;
        RAW.fromTo(
          item,
          { opacity: 0 },
          {
            opacity: 1,
            delay: 0.25,
            duration: 0.25,
            yoyo: true,
            ease: "none",
            repeat: 1,
            immediateRender: false,
          },
          time
        )
          .fromTo(
            item,
            { scale: 0 },
            {
              scale: 1,
              zIndex: 100,
              duration: 0.5,
              yoyo: true,
              repeat: 1,
              ease: "none",
              immediateRender: false,
            },
            time
          )
          .fromTo(
            item,
            { xPercent: 250 },
            { xPercent: -250, duration: 1, ease: "none", immediateRender: false },
            time
          );
      }

      RAW.time(START);
      LOOP.to(RAW, {
        time: LOOP_TIME,
        duration: LOOP_TIME - START,
        ease: "none",
      }).fromTo(
        RAW,
        { time: OVERLAP * spacing + 1 },
        {
          time: START,
          duration: START - (OVERLAP * spacing + 1),
          immediateRender: false,
          ease: "none",
        }
      );
      return LOOP;
    };

    const LOOP = buildLoop(CARDS, SPACING);
    const scrub = gsap.to(LOOP, {
      totalTime: 0,
      duration: 0.5,
      ease: "power3",
      paused: true,
    });

    let iteration = 0;
    const wrapForward = () => {
      iteration++;
    };
    const wrapBackward = () => {
      iteration--;
      if (iteration < 0) {
        iteration = 9;
        LOOP.totalTime(LOOP.totalTime() + LOOP.duration() * 10);
      }
    };
    const scrubTo = (totalTime: number) => {
      const progress =
        (totalTime - LOOP.duration() * iteration) / LOOP.duration();
      if (progress > 1) wrapForward();
      else if (progress < 0) wrapBackward();
      scrub.vars.totalTime = CARD_SNAP(totalTime);
      scrub.invalidate().restart();
    };

    const advance = (dir: 1 | -1) => scrubTo(scrub.vars.totalTime + dir * SPACING);

    const nextBtn = root.querySelector(".gallery__next");
    const prevBtn = root.querySelector(".gallery__prev");
    const onNext = () => advance(1);
    const onPrev = () => advance(-1);
    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", onPrev);

    return () => {
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
      scrub.kill();
      LOOP.kill();
    };
  }, [items]);

  return (
    <div
      ref={rootRef}
      className="gallery relative mx-auto h-[34rem] w-full max-w-6xl overflow-hidden"
    >
      <ul className="absolute left-1/2 top-1/2 h-96 w-72 -translate-x-1/2 -translate-y-1/2">
        {items.map((art) => (
          <li key={art.id} className="card absolute h-96 w-72">
            <Link
              href={`/artwork/${art.id}`}
              className="group block h-full w-full cursor-pointer"
              aria-label={`${art.title} — дэлгэрэнгүй`}
            >
              <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gray-900 shadow-2xl shadow-accent/20 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={optimizeCloudinaryUrl(art.image)}
                  alt={`${art.title} — ${art.artist.name}-ийн`}
                  fill
                  sizes="288px"
                  className="card__image absolute inset-0 h-full w-full scale-110 object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="card__details absolute inset-0 flex flex-col items-center justify-center pt-64">
                  <span className="card__type w-full text-center text-xs uppercase tracking-widest text-white/70">
                    {art.category?.name}
                  </span>
                  <h2 className="card__title w-full px-3 pb-12 text-center text-2xl font-black text-white">
                    {art.title}
                  </h2>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-label="Өмнөх"
        className="gallery__prev absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-md transition-all duration-300 hover:-translate-y-[55%] hover:shadow-lg hover:shadow-accent/30 sm:left-6"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 256 512"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Дараах"
        className="gallery__next absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-md transition-all duration-300 hover:-translate-y-[55%] hover:shadow-lg hover:shadow-accent/30 sm:right-6"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 256 512"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z" />
        </svg>
      </button>
    </div>
  );
}
