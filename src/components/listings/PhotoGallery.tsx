"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Building2 } from "lucide-react";

interface Props {
  photos: string[];
  title: string;
}

const SWIPE_THRESHOLD = 40;

function wrapIndex(index: number, count: number) {
  return ((index % count) + count) % count;
}

export default function PhotoGallery({ photos, title }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"prev" | "next" | null>(null);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const count = photos.length;

  function go(idx: number, direction?: "prev" | "next") {
    const nextIndex = wrapIndex(idx, count);
    if (nextIndex === current || count === 0) return;
    setSlideDirection(direction ?? (nextIndex > current ? "next" : "prev"));
    setCurrent(nextIndex);
  }
  function prev() { go(current - 1, "prev"); }
  function next() { go(current + 1, "next"); }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      didSwipe.current = true;
      delta > 0 ? next() : prev();
    }
    touchStartX.current = null;
  }

  function handleMainClick() {
    if (!didSwipe.current && count > 0) setLightbox(true);
    didSwipe.current = false;
  }

  const prevIndex = count > 0 ? wrapIndex(current - 1, count) : 0;
  const nextIndex = count > 0 ? wrapIndex(current + 1, count) : 0;
  const visibleSlides = count === 1
    ? [{ index: current, slot: "current" as const }]
    : [
        { index: prevIndex, slot: "prev" as const },
        { index: current, slot: "current" as const },
        { index: nextIndex, slot: "next" as const },
      ];

  if (count === 0) {
    return (
      <div className="w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Building2 size={64} className="text-gray-300" strokeWidth={1} />
      </div>
    );
  }

  return (
    <>
      {/* ── Inline swipeable gallery ───────────────────────────────────── */}
      <div
        className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gray-100 overflow-hidden select-none cursor-pointer group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleMainClick}
      >
        <div
          key={current}
          className={`relative h-full w-full motion-safe:animate-[gallery-slide_220ms_ease-out] ${
            slideDirection === "prev" ? "[--slide-from:-18px]" : "[--slide-from:18px]"
          }`}
        >
          {visibleSlides.map(({ index, slot }) => (
            <div
              key={`${slot}-${index}`}
              className={`absolute inset-y-0 w-full ${
                slot === "prev"
                  ? "-translate-x-full"
                  : slot === "next"
                    ? "translate-x-full"
                    : "translate-x-0"
              }`}
              aria-hidden={slot !== "current"}
            >
              <Image
                src={photos[index]}
                alt={`${title} - ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="100vw"
                quality={78}
              />
            </div>
          ))}
        </div>

        {/* Prev / Next arrows — always visible on mobile, hover on desktop */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute start-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="السابق"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute end-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-all sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="التالي"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); go(i); }}
                aria-label={`صورة ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter badge */}
        {count > 1 && (
          <div className="absolute top-3 end-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10 pointer-events-none">
            {current + 1} / {count}
          </div>
        )}
      </div>

      {/* ── Fullscreen lightbox ────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 end-4 z-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            aria-label="إغلاق"
          >
            <X size={28} />
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[80dvh] aspect-video mx-4 sm:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[current]}
              alt={`${title} - ${current + 1}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 896px, calc(100vw - 32px)"
              quality={88}
            />
          </div>

          {/* Arrows */}
          {count > 1 && (
            <>
              <button
                className="absolute start-2 sm:start-4 top-1/2 -translate-y-1/2 z-10 text-white p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="السابق"
              >
                <ChevronRight size={30} />
              </button>
              <button
                className="absolute end-2 sm:end-4 top-1/2 -translate-y-1/2 z-10 text-white p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="التالي"
              >
                <ChevronLeft size={30} />
              </button>
            </>
          )}

          {/* Dots in lightbox */}
          {count > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); go(i); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}

          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-xs pointer-events-none">
            {current + 1} / {count}
          </p>
        </div>
      )}
    </>
  );
}
