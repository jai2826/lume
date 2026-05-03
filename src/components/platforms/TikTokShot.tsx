"use client";

import { Music2, Bookmark, ChevronDown, Heart, MessageCircle, Plus, Share2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { ShotPreviewData } from "./shot-preview-model";
import {
  isLikelyVideoUrl,
  previewBodyText,
  primaryMediaUrl,
} from "./shot-preview-model";

export function TikTokShot({
  shot,
  className,
  creator = "@lumecreates",
}: {
  shot: ShotPreviewData;
  className?: string;
  creator?: string;
}) {
  const platform = shot.platforms.tiktok;
  const caption = previewBodyText(shot.inputs, platform);
  const mediaSrc = primaryMediaUrl(shot.inputs, platform);

  let videoSrc: string | undefined;
  if (mediaSrc && isLikelyVideoUrl(mediaSrc)) videoSrc = mediaSrc;
  else if (shot.inputs.videos[0]) videoSrc = shot.inputs.videos[0];

  const cover =
    shot.inputs.images[0] ||
    platform.mediaAssetUrl.trim() ||
    undefined;

  return (
    <div
      aria-label="TikTok mobile preview"
      className={cn(
        "inline-flex rounded-[38px] border-[11px] border-[#090909] bg-[#050505] shadow-2xl ring-4 ring-black/60",
        className,
      )}
    >
      <div className="relative flex h-[min(640px,calc(100vh-6rem))] w-[clamp(238px,30vw,320px)] flex-col overflow-hidden rounded-[29px] bg-black">
        {/* Ambient blurred stack behind content */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="absolute inset-0 scale-125 object-cover opacity-55 blur-[30px]"
            aria-hidden
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#16213e] via-[#0f0520] to-black" aria-hidden />
        )}

        <div className="relative z-[1] flex flex-1 flex-col">
          {/* status bar sham */}
          <div className="flex items-center justify-between px-4 pt-4 text-[13px] font-semibold tracking-wide text-white">
            <button type="button" aria-label="For you tab" className="opacity-40">
              Following
            </button>
            <span className="border-b-[3px] border-white pb-0.5">For You</span>
            <ChevronDown className="size-5 opacity-80" aria-hidden />
          </div>

          <div className="relative flex min-h-0 flex-1 items-stretch pb-24">
            {videoSrc ? (
              <video
                src={videoSrc}
                className="w-full flex-1 object-cover"
                muted
                loop
                playsInline
                autoPlay={false}
                controls
                poster={cover !== videoSrc ? cover : undefined}
                preload="metadata"
              />
            ) : cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="w-full flex-1 object-cover" />
            ) : (
              <div className="m-6 flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 text-center">
                <p className="text-[13px] leading-relaxed text-white/65">
                  Add video to your shot for a vertical TikTok-style preview here.
                </p>
              </div>
            )}

            {/* Right rail interactions */}
            <div className="pointer-events-none absolute bottom-36 right-1 z-10 flex flex-col gap-7 pr-3 text-[11px] font-semibold text-white">
              <RailAction>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="flex size-[46px] items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-orange-600 p-[2px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="flex size-[42px] items-center justify-center rounded-full bg-black ring-4 ring-black/55">
                    <img
                      src={
                        cover ??
                        `data:image/svg+xml,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23222"/></svg>`,
                        )}`
                      }
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  </span>
                </span>
                <Plus className="absolute -bottom-1 left-1/2 size-5 -translate-x-1/2 rounded-full bg-red-600 p-1 text-white" />
              </RailAction>

              <RailAction label="892.3K">
                <Heart className="size-[30px]" fill="currentColor" strokeWidth={0} />
              </RailAction>
              <RailAction label="3421">
                <MessageCircle className="size-[28px]" strokeWidth={1.7} />
              </RailAction>
              <RailAction label="Bookmark">
                <Bookmark className="size-[26px]" fill="white" stroke="black" strokeWidth={1.2} />
              </RailAction>
              <RailAction label="Share">
                <Share2 className="size-[24px]" strokeWidth={2} />
              </RailAction>
            </div>

            {/* Bottom caption + sound pill */}
            <div className="pointer-events-none absolute bottom-24 left-0 right-14 z-10 px-4">
              <p className="text-[15px] font-semibold text-white">{creator}</p>
              <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-snug text-white/94">
                {caption || (
                  <span className="text-white/50">Caption previews after generation completes.</span>
                )}
              </p>
              <button
                type="button"
                className="pointer-events-auto mt-4 flex items-center gap-2 rounded-xl bg-black/35 px-2.5 py-1.5 text-[13px] text-white backdrop-blur-md border border-transparent cursor-default hover:border-transparent"
              >
                <Music2 className="size-4 shrink-0" />
                <span className="truncate">
                  Original sound ·{" "}
                  {platform.status === "ready"
                    ? "Lume Remix"
                    : platform.status === "generating"
                      ? "Generating…"
                      : "Draft stem"}
                </span>
              </button>
            </div>
          </div>

          {/* home indicator */}
          <div className="absolute bottom-2 left-1/2 z-[2] h-1 w-[34%] -translate-x-1/2 rounded-full bg-white/30" />

          {/* bottom chrome */}
          <div className="absolute bottom-0 left-0 right-0 z-[2] border-t border-white/[0.05] bg-gradient-to-t from-black/92 to-transparent px-6 pb-6 pt-3 text-[11px] font-medium uppercase tracking-[0.15em] text-white/65">
            <div className="flex justify-around">
              <span className="text-white font-semibold">Home</span>
              <span>Discover</span>
              <span className="rounded-lg bg-white px-8 py-5 text-transparent">＋</span>
              <span>Inbox</span>
              <span>Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailAction({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative flex flex-col items-center gap-1 text-center drop-shadow-lg">
      {children}
      {label ? <span className="max-w-[3.75rem] leading-tight opacity-96">{label}</span> : null}
    </div>
  );
}
