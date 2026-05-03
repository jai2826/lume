"use client";

import { Bookmark, Ellipsis, Heart, MessageCircle, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type { ShotPreviewData } from "./shot-preview-model";
import {
  carouselOrVideo,
  isLikelyVideoUrl,
  previewBodyText,
} from "./shot-preview-model";

const IG_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f58529"/><stop offset="0.5" stop-color="#dd2a7b"/>
        <stop offset="1" stop-color="#515bd4"/></linearGradient></defs>
      <circle cx="20" cy="20" r="20" fill="url(#g)"/><circle cx="20" cy="20" r="15" fill="#0f0f0f"/>
      <text x="20" y="24" fill="white" font-size="10" font-family="sans-serif" text-anchor="middle" font-weight="700">LU</text>
    </svg>`,
  );

export function InstaShot({
  shot,
  className,
  username = "lumecreative",
}: {
  shot: ShotPreviewData;
  className?: string;
  username?: string;
}) {
  const platform = shot.platforms.instagram;
  const caption = previewBodyText(shot.inputs, platform);
  const { images, videoUrl } = carouselOrVideo(shot.inputs, platform);
  const hasCarousel = images.length > 1;
  const slides =
    images.length > 0
      ? images
      : videoUrl
        ? [videoUrl]
        : platform.mediaAssetUrl.trim()
          ? [platform.mediaAssetUrl.trim()]
          : [];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.join("|")]);

  const safeIdx = slides.length === 0 ? 0 : index % slides.length;
  const current = slides[safeIdx];
  const currentIsVideo = current ? isLikelyVideoUrl(current) : !!videoUrl;

  const prev = useCallback(() => {
    if (slides.length < 2) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    if (slides.length < 2) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  return (
    <article
      aria-label="Instagram feed post preview"
      className={cn(
        "w-full max-w-[470px] overflow-hidden rounded-lg border border-white/[0.07] bg-black text-[#f5f5f5] shadow-2xl",
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b border-white/[0.07] px-3 py-2.5">
        <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-orange-600 to-purple-900 p-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
          <img src={IG_AVATAR} alt="" className="size-8 rounded-full border border-black bg-black" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[13.5px] font-semibold leading-none">{username}</span>
          <span className="mt-1 block truncate text-[12px] text-[#a8a8a8]">
            {platform.status === "ready"
              ? "Original audio · Preview"
              : platform.status === "generating"
                ? "Generating…"
                : "Draft"}
          </span>
        </div>
        <Ellipsis className="size-7 shrink-0 text-[#f5f5f5]" />
      </header>

      <div className="relative aspect-square w-full bg-[#090909]">
        {slides.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-[#8e8e8e]">
            Add imagery to see the carousel, or publish to let Lume attach the selected asset here.
          </div>
        ) : currentIsVideo ? (
          <video
            key={current}
            src={videoUrl ?? current}
            className="size-full object-cover"
            controls
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current}
            src={current}
            alt={`Slide ${safeIdx + 1}`}
            className="size-full object-cover"
          />
        )}

        {hasCarousel ? (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={prev}
              className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white shadow-lg backdrop-blur-sm sm:flex"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={next}
              className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white shadow-lg backdrop-blur-sm sm:flex"
            >
              ›
            </button>
            <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-1">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-white/40",
                    i === safeIdx && "bg-white",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <footer className="flex flex-col gap-2 px-3 py-3 text-[13.5px]">
        <div className="flex items-center gap-5 text-[#f5f5f5]">
          <Heart className="size-[26px] cursor-default" strokeWidth={1.4} aria-hidden />
          <MessageCircle className="size-[26px]" strokeWidth={1.35} aria-hidden />
          <Send className="size-[24px] -translate-x-px -rotate-[24deg]" strokeWidth={1.35} aria-hidden />
          <Bookmark className="ml-auto size-[24px]" strokeWidth={1.35} aria-hidden />
        </div>

        <p className="text-[13px] leading-snug text-[#ebebeb]">
          <span className="font-semibold">{username}</span>
          {' '}
          <span className="font-normal text-[#f5f5f5]/95">
            {caption || (
              <span className="text-[#909090]">Caption appears when AI copy is ready.</span>
            )}
          </span>
        </p>
      </footer>
    </article>
  );
}
