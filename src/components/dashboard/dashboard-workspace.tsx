"use client";

import { ShotComposer } from "@/components/composer/ShotComposer";
import type {
  ShotPlatformEntry,
  ShotPreviewData,
} from "@/components/platforms/shot-preview-model";
import { InstaShot } from "@/components/platforms/InstaShot";
import { TikTokShot } from "@/components/platforms/TikTokShot";
import { TwitterShot } from "@/components/platforms/TwitterShot";
import { YoutubeShot } from "@/components/platforms/YoutubeShot";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";

function shotDocToPreview(doc: Doc<"shots">):  {
  return {
    title: doc.title,
    inputs: {
      ...doc.inputs,
      images: doc.inputs.images ?? [],
      videos: doc.inputs.videos ?? [],
      audios: doc.inputs.audios ?? [],
    },
    platforms: doc.platforms,
  };
}

function StatusStrip({ entry, label }: { entry: ShotPlatformEntry; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-1 text-[10px]",
          entry.status === "idle" &&
            "border border-muted-foreground/25 bg-muted/25 text-muted-foreground",
          entry.status === "generating" &&
            "border border-cyan-400/35 bg-cyan-500/[0.12] text-cyan-300",
          entry.status === "ready" &&
            "border border-brand-accent/45 bg-brand-accent/12 text-brand-accent",
        )}
      >
        {entry.status === "idle" && "Queued"}
        {entry.status === "generating" && "Generating"}
        {entry.status === "ready" && "Ready"}
      </span>
    </div>
  );
}

function SnapchatSlot({ shot }: { shot: ShotPreviewData }) {
  const s = shot.platforms.snapchat;
  const readyBody =
    s.generatedText.trim() ||
    (s.mediaAssetUrl
      ? `Asset: ${s.mediaAssetUrl.slice(0, 42)}${s.mediaAssetUrl.length > 42 ? "…" : ""}`
      : "");

  return (
    <div className="flex min-h-[180px] flex-col rounded-[inherit] border-0 bg-card/80 shadow-inner shadow-black/20 backdrop-blur-sm">
      <StatusStrip entry={s} label="Stories · Snapchat" />
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center transition-all duration-500",
          s.status === "idle" && "opacity-55 saturate-[0.75]",
          s.status === "generating" &&
            "opacity-95 [animation-duration:3s] motion-safe:animate-pulse",
          s.status === "ready" &&
            "bg-gradient-to-br from-brand-accent/[0.08] via-transparent to-cyan-500/[0.05]",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-xl border border-muted-foreground/30 bg-muted/30 text-muted-foreground">
          <Layers className="size-6" aria-hidden strokeWidth={1.5} />
        </div>
        <p className="max-w-[15rem] text-[12px] leading-relaxed text-muted-foreground">
          {s.status === "ready" && readyBody
            ? readyBody
            : "Story frames hydrate here once Lume attaches vertical cuts for Snap."}
        </p>
      </div>
    </div>
  );
}

/** Maps Convex status to glowing card chrome updated live via subscriptions. */
function BentoGlow({
  children,
  status,
  className,
}: {
  children: React.ReactNode;
  status: ShotPlatformEntry["status"];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-[opacity,transform,box-shadow] duration-500 motion-reduce:transition-none",
        status === "idle" && "border-muted-foreground/15 opacity-[0.9] shadow-none",
        status === "generating" &&
          "border-cyan-400/35 opacity-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.1),0_0_52px_-16px_rgba(103,232,249,0.38)] motion-safe:animate-pulse",
        status === "ready" &&
          "border-brand-accent/[0.38] opacity-100 shadow-[0_0_44px_-16px_rgb(255,255,255,0.14)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Per-platform cell: Convex row updates repaint preview + status chip in real time. */
function PlatformCells({ shot }: { shot: ShotPreviewData }) {
  return (
    <>
      <BentoGlow
        status={shot.platforms.x.status}
        className="flex flex-col bg-card lg:col-span-6"
      >
        <StatusStrip entry={shot.platforms.x} label="X / Twitter" />
        <div className="max-h-[min(58vh,520px)] overflow-auto px-4 py-4">
          <TwitterShot shot={shot} className="max-w-full shadow-none ring-1 ring-muted-foreground/10" />
        </div>
      </BentoGlow>

      <BentoGlow
        status={shot.platforms.instagram.status}
        className="flex flex-col bg-card lg:col-span-6 lg:min-h-[380px]"
      >
        <StatusStrip entry={shot.platforms.instagram} label="Instagram" />
        <div className="flex min-h-0 flex-1 justify-center overflow-auto px-4 py-4">
          <InstaShot shot={shot} className="shadow-none ring-1 ring-muted-foreground/10" />
        </div>
      </BentoGlow>

      <BentoGlow
        status={shot.platforms.youtube.status}
        className="flex flex-col bg-card lg:col-span-6"
      >
        <StatusStrip entry={shot.platforms.youtube} label="YouTube Shorts" />
        <div className="flex justify-start overflow-auto px-4 py-4">
          <YoutubeShot shot={shot} className="max-h-[min(64vh,640px)] max-w-none shadow-none ring-1 ring-muted-foreground/10" />
        </div>
      </BentoGlow>

      <BentoGlow
        status={shot.platforms.tiktok.status}
        className="flex flex-col bg-card lg:col-span-6"
      >
        <StatusStrip entry={shot.platforms.tiktok} label="TikTok" />
        <div className="flex justify-center overflow-auto px-4 py-5">
          <TikTokShot shot={shot} className="shadow-none ring-1 ring-muted-foreground/25" />
        </div>
      </BentoGlow>

      <BentoGlow
        status={shot.platforms.snapchat.status}
        className="flex flex-col lg:col-span-full"
      >
        <SnapchatSlot shot={shot} />
      </BentoGlow>
    </>
  );
}

/** Empty placeholders while no shot exists (still renders bento structure). */
function PlatformPlaceholder({
  platform,
  subtitle,
}: {
  platform: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/[0.04] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {platform}
      </p>
      <p className="mt-4 flex-1 text-[12px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function DashboardWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const shotQuery = searchParams.get("shot");
  const trimmed = shotQuery?.trim();
  const args =
    trimmed && trimmed.length > 8
      ? { shotId: trimmed as Id<"shots"> }
      : {};

  const shotDoc = useQuery(api.shots.dashboardShot, args);
  const shot = shotDoc ? shotDocToPreview(shotDoc) : undefined;
  const isLoadingShot = shotDoc === undefined;

  const onShotCreated = (id: Id<"shots">) => {
    router.replace(`/${slug}/dashboard?shot=${id}`, { scroll: false });
  };

  const platformsForCount: ShotPlatformEntry[] = shot
    ? [
        shot.platforms.x,
        shot.platforms.instagram,
        shot.platforms.youtube,
        shot.platforms.tiktok,
        shot.platforms.snapchat,
      ]
    : [];
  const readyPlatformsCount = platformsForCount.filter(
    (p) => p.status === "ready",
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-8 sm:px-8 xl:py-11">
      <header className="mb-10 flex flex-col gap-6 border-b border-border/70 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/"
            className="mb-4 inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Lume Studio
          </Link>
          <h1 className="text-pretty font-semibold tracking-tight text-[clamp(1.5rem,2.5vw,2rem)] leading-tight text-foreground">
            Distribution cockpit
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            Compose once; watch each platform preview react as Convex streams shot updates —
            captions, thumbnails, and status chips refresh as soon as the model writes them.
          </p>
          {shot && shotDoc ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Platforms ready:{" "}
              <span className="font-semibold tabular-nums text-foreground">{readyPlatformsCount}</span>
              {" / "}5 ·{" "}
              <span className="tabular-nums text-muted-foreground/80">
                {new Date(shotDoc._creationTime).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          ) : null}
        </div>

        {!isLoadingShot && !shot ? (
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Submit a shot from the composer to populate this board. Convex will drive each card as generations land.
          </p>
        ) : null}

        {isLoadingShot ? (
          <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground xl:mr-2 xl:mt-14">
            Syncing Convex…
          </span>
        ) : null}
      </header>

      <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12 xl:justify-between">
        <aside className="w-full xl:sticky xl:top-[5.75rem] xl:max-w-md xl:flex-1 xl:shrink-0">
          <ShotComposer className="w-full shrink-0" onShotCreated={onShotCreated} />
        </aside>

        <section className="min-w-0 flex-1">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Live platform board
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:auto-rows-[min-content] lg:gap-x-6 lg:gap-y-6">
            {shot ? (
              <PlatformCells shot={shot} />
            ) : (
              <>
                <div className="lg:col-span-6">
                  <PlatformPlaceholder
                    platform="X / Twitter"
                    subtitle="Thread layout appears with your drafted copy plus the asset Convex pins for 𝕏."
                  />
                </div>
                <div className="lg:col-span-6">
                  <PlatformPlaceholder
                    platform="Instagram"
                    subtitle="Feed post + carousel choreography lights up whenever multiple stills arrive."
                  />
                </div>
                <div className="lg:col-span-6">
                  <PlatformPlaceholder
                    platform="YouTube Shorts"
                    subtitle="Portrait preview with metadata reacts when `youtube.generatedText` and media resolve."
                  />
                </div>
                <div className="lg:col-span-6">
                  <PlatformPlaceholder
                    platform="TikTok"
                    subtitle="Vertical phone mock mirrors `tiktok` slot output in real time."
                  />
                </div>
                <div className="lg:col-span-full">
                  <PlatformPlaceholder
                    platform="Snapchat Stories"
                    subtitle="Schema-backed slot for ephemeral verticals — pulses with `snapchat.status`."
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
