"use client";

import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Ellipsis,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  type ShotPreviewData,
  isLikelyVideoUrl,
  previewBodyText,
  primaryMediaUrl,
} from "./shot-preview-model";

const SAMPLE_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#1d9bf0"/>
      <text x="20" y="24" fill="white" font-size="12" font-family="sans-serif" text-anchor="middle">LU</text>
    </svg>`,
  );

const iconMuted = "#71767b";

export function TwitterShot({
  shot,
  className,
  displayName = "Lume Creator",
  handle = "lumecreator",
}: {
  shot: ShotPreviewData;
  className?: string;
  displayName?: string;
  handle?: string;
}) {
  const platform = shot.platforms.twitter;
  const body = previewBodyText(shot.inputs, platform);
  const mediaSrc = primaryMediaUrl(shot.inputs, platform);
  const isVideo =
    typeof mediaSrc === "string" && isLikelyVideoUrl(mediaSrc);
  const timeStamp =
    platform.status === "idle" ? "draft" : platform.status === "generating" ? "…" : "now";

  return (
    <article
      aria-label="X post preview"
      className={cn(
        "w-full max-w-[598px] overflow-hidden rounded-xl border border-white/[0.08] bg-black text-[#e7e9ea] shadow-2xl",
        className,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
        <img
          src={SAMPLE_AVATAR}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full border border-white/10 object-cover"
        />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-[15px] font-bold leading-tight">{displayName}</span>
            <BadgeCheck
              className="size-[18px] shrink-0 text-[#1d9bf0]"
              aria-hidden
              fill="currentColor"
            />
            <span className="text-[13px]" style={{ color: iconMuted }}>
              @{handle}
            </span>
            <span className="text-[13px] opacity-50" style={{ color: iconMuted }}>
              · {timeStamp}
            </span>
            <Ellipsis
              className="ml-auto size-5 shrink-0"
              style={{ color: iconMuted }}
              aria-hidden
            />
          </header>

          {platform.status === "generating" ? (
            <p className="mt-3 text-[13px]" style={{ color: iconMuted }}>
              Generating caption…
            </p>
          ) : null}

          <p className="mt-3 whitespace-pre-wrap text-[14.75px] leading-normal text-[#eceeed]">
            {body || "\u200b"}
          </p>

          {mediaSrc ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08]">
              {isVideo ? (
                <video
                  src={mediaSrc}
                  className="aspect-video max-h-[440px] w-full bg-black object-cover"
                  controls
                  muted
                  playsInline
                  poster={shot.inputs.images[0]}
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaSrc}
                  alt="Post media"
                  className="aspect-[16/10] max-h-[440px] w-full bg-black object-cover"
                />
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-4 py-8 text-center text-[13px] text-[#71767b]">
              No attachment yet — AI will pick assets for 𝕏 once ready.
            </div>
          )}

          <div
            className="mt-4 flex max-w-[480px] items-center justify-between border-t border-white/[0.08] pt-3"
            style={{ color: iconMuted }}
          >
            <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Reply">
              <MessageCircle className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Repost">
              <Repeat2 className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Like">
              <Heart className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Analytics">
              <BarChart3 className="size-[18px]" strokeWidth={1.75} />
            </button>
            <div className="flex gap-1">
              <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Bookmark">
                <Bookmark className="size-[18px]" strokeWidth={1.75} />
              </button>
              <button type="button" className="rounded-full p-2 hover:bg-white/[0.06]" aria-label="Share">
                <Share className="size-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
