"use client";

import { MoreVertical, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { ShotPreviewData } from "./shot-preview-model";
import {
  isLikelyVideoUrl,
  previewBodyText,
  primaryMediaUrl,
} from "./shot-preview-model";

const CHAN_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#ff0000"/><text x="20" y="25" fill="#fff" font-size="16" font-family="sans-serif" text-anchor="middle" font-weight="800">▶</text></svg>`,
  );

export function YoutubeShot({
  shot,
  className,
  channelName = "Lume Labs",
  subscriberLabel = "148K subscribers",
}: {
  shot: ShotPreviewData;
  className?: string;
  channelName?: string;
  subscriberLabel?: string;
}) {
  const platform = shot.platforms.youtube;
  const description = previewBodyText(shot.inputs, platform);
  const mediaSrc = primaryMediaUrl(shot.inputs, platform);
  const videoSrc =
    (mediaSrc && isLikelyVideoUrl(mediaSrc) ? mediaSrc : undefined) ??
    shot.inputs.videos[0];
  const fallbackThumb = shot.inputs.images[0];
  const titleText =
    shot.title?.trim() ||
    (description
      ? description.split("\n")[0].slice(0, 80) +
        (description.split("\n")[0].length > 80 ? "…" : "")
      : "Short title goes here");

  return (
    <article
      aria-label="YouTube Shorts style preview"
      className={cn(
        "flex w-full max-w-[420px] gap-3 rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-3 text-[#f1f1f1] shadow-2xl sm:max-w-none sm:min-w-[560px]",
        className,
      )}
    >
      {/* Main video column — Shorts pillar ratio */}
      <div className="relative w-[min(100%,220px)] shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-black sm:w-[200px]">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="aspect-[9/16] w-full object-cover"
            controls
            muted
            playsInline
            poster={fallbackThumb}
            preload="metadata"
          />
        ) : fallbackThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallbackThumb} alt="" className="aspect-[9/16] w-full object-cover" />
        ) : (
          <div className="flex aspect-[9/16] flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#1e1e1e] to-black px-4 text-center">
            <span className="text-3xl">▶</span>
            <p className="text-[12px] leading-relaxed text-[#aaaaaa]">
              Drop footage in the shot to preview it as a Short.
            </p>
          </div>
        )}

        {/* Shorts mobile-style edge stack (decorative) */}
        <div className="pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 flex-col gap-3 text-[10px] font-medium text-white/90">
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-black/40 px-1 py-2 backdrop-blur-[2px]">♡</span>
            <span>12k</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-black/40 px-1 py-2 backdrop-blur-[2px]">💬</span>
            <span>302</span>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#f1f1f1]">
          {titleText}
        </h3>
        <div className="mt-1 text-[12px] text-[#aaaaaa]">
          {platform.status === "generating" && "AI is shaping this cut…"}
          {platform.status === "idle" && "Draft · not published"}
          {platform.status === "ready" && "Ready to review"}
        </div>

        <div className="mt-4 flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CHAN_AVATAR} alt="" className="size-9 shrink-0 rounded-full bg-[#212121]" />
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-tight">{channelName}</p>
            <p className="mt-0.5 text-[12px] text-[#aaaaaa]">{subscriberLabel}</p>
          </div>
          <button
            type="button"
            className="ml-auto shrink-0 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold tracking-wide text-black hover:bg-neutral-100"
          >
            SUBSCRIBE
          </button>
        </div>

        <details className="mt-5 cursor-pointer rounded-lg bg-[#272727] px-3 py-2 text-[13px] text-[#e5e5e5] [&_summary]:outline-none [&_summary]:marker:text-transparent">
          <summary className="flex list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>{description.split("\n").length > 1 ? "More" : "Description"}</span>
            <MoreVertical className="size-4 shrink-0 text-[#939393]" />
          </summary>
          <div className="mt-3 max-h-[120px] overflow-y-auto whitespace-pre-wrap pb-2 text-[#cccccc]/95">
            {description || (
              <span className="text-[#888]">Detailed description fills in once generation succeeds.</span>
            )}
          </div>
        </details>

        <div className="mt-6 flex gap-10 text-[#aaaaaa]">
          <ShortAction icon={<ThumbsUp className="size-5" strokeWidth={1.5} />} label="18K" />
          <ShortAction icon={<ThumbsDown className="size-5" strokeWidth={1.5} />} label="Share" muted />
          <ShortAction emoji="💬" label="Comments" muted />
          <ShortAction emoji="↗" label="Remix" muted />
        </div>
      </div>
    </article>
  );
}

function ShortAction({
  icon,
  emoji,
  label,
  muted,
}: {
  icon?: ReactNode;
  emoji?: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex cursor-default flex-col items-center gap-1 text-[11px]",
        muted && "opacity-70",
      )}
    >
      {icon ?? (
        <span className="text-lg leading-none" aria-hidden>
          {emoji}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
}
