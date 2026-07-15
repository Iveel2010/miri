"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Artwork } from "@/types/artwork";
import LightboxModal from "./Lightbox";
import SafeImage from "./SafeImage";

interface ArtworkGalleryProps {
  artwork: Artwork;
}

export default function ArtworkGallery({ artwork }: ArtworkGalleryProps) {
  const gallery =
    artwork.images && artwork.images.length ? artwork.images : [artwork.image];

  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [visible, setVisible] = useState(true);
  const touchStartX = useRef(0);

  const changeSlide = useCallback((newIndex: number) => {
    setVisible(false);
    setTimeout(() => {
      setActive(newIndex);
      setVisible(true);
    }, 350);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      const next = (active + dir + gallery.length) % gallery.length;
      changeSlide(next);
    },
    [active, gallery.length, changeSlide]
  );

  const current = gallery[active] ?? gallery[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      go(diff > 0 ? 1 : -1);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="group relative block aspect-[4/5] w-full cursor-zoom-in"
          aria-label={`${artwork.title} — томоор харах`}
        >
          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <SafeImage
              src={current}
              alt={`${artwork.title} — ${artwork.artist}-ийн`}
              fill
              priority={active === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>

          <div className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {active + 1} / {gallery.length}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm">
              Томоор харах
            </span>
          </div>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Өмнөх зураг"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Дараах зураг"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </button>
      </div>

      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => changeSlide(i)}
              aria-label={`Зураг ${i + 1}`}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === active
                  ? "border-accent shadow-md shadow-accent/10"
                  : "border-border hover:border-accent/60 hover:shadow-sm"
              }`}
            >
              <SafeImage
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
              {i === active && (
                <div className="absolute inset-0 bg-accent/10" />
              )}
            </button>
          ))}
        </div>
      )}

      <LightboxModal
        images={gallery}
        title={artwork.title}
        artist={artwork.artist}
        initialIndex={active}
        open={zoom}
        onClose={() => setZoom(false)}
      />
    </div>
  );
}
