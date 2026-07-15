"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface LightboxModalProps {
  images: string[];
  title: string;
  artist: string;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function LightboxModal({
  images,
  title,
  artist,
  initialIndex = 0,
  open,
  onClose,
}: LightboxModalProps) {
  const items = images;
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const close = useCallback(() => {
    onClose();
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [onClose]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + items.length) % items.length);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    },
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const next = s - e.deltaY * 0.0015;
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    });
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  if (!open) return null;

  const current = items[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${artist}-ийн`}
      className="fixed inset-0 z-[100] flex flex-col bg-primary/90 backdrop-blur-md"
      onClick={close}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <p className="font-display text-lg">
          {title}{" "}
          <span className="text-white/60">— {artist}</span>
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Хаах"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Өмнөх"
              className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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
              onClick={() => go(1)}
              aria-label="Дараах"
              className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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

        <div
          className="relative h-full w-full"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            cursor: scale > 1 ? "grab" : "zoom-in",
            touchAction: "none",
          }}
          onClick={() => {
            if (scale === 1) setScale(2);
            else {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }
          }}
        >
          <Image
            src={current}
            alt={`${title} — ${artist}-ийн`}
            fill
            sizes="100vw"
            className="object-contain select-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: dragging ? "none" : "transform 0.2s ease-out",
            }}
            draggable={false}
          />
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex justify-center gap-2 px-5 py-4">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Зураг ${i + 1}`}
              onClick={() => {
                setIndex(i);
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-7 bg-white"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
