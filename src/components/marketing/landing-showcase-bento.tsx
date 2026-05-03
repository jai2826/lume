"use client";

import type { ShotPreviewData } from "@/components/platforms/shot-preview-model";
import { InstaShot } from "@/components/platforms/InstaShot";
import { TikTokShot } from "@/components/platforms/TikTokShot";
import { TwitterShot } from "@/components/platforms/TwitterShot";
import { YoutubeShot } from "@/components/platforms/YoutubeShot";
import { cn } from "@/lib/utils";

/** Rich mock tailored for responsive platform chrome in the landing bento. */
export const MOCK_SHOWCASE_SHOT: ShotPreviewData = {
  title: "Nocturne · Autumn campaign",
  inputs: {
    text: "One master narrative. Native surfaces everywhere your audience waits.",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=82",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=82",
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1400&q=82",
    ],
    videos: [
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    ],
  },
  platforms: {
    twitter: {
      status: "ready",
      generatedText:
        "Quiet luxury isn’t louder — it’s sharper. Tonight we ship the cut that earns the scroll stop.",
      mediaAssetUrl:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    },
    instagram: {
      status: "ready",
      generatedText:
        "Carousel three ways to say the same whisper. Save the palette; share the reel.",
      mediaAssetUrl:
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    },
    youtube: {
      status: "ready",
      generatedText:
        "Nine seconds of tension, one hook, channel-native metadata — Shorts pacing without shouting.",
      mediaAssetUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    tiktok: {
      status: "ready",
      generatedText:
        "POV: distribution finally mirrors your aesthetic. Caption locks to vertical safe zones.",
      mediaAssetUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    snapchat: {
      status: "ready",
      generatedText:
        "Story trims with lens-safe gutters — ephemeral, still premium.",
      mediaAssetUrl:
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=900&q=80",
    },
  },
};

function PreviewShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-[color:rgba(255,255,255,0.065)] bg-[color:rgb(9_9_9_/0.75)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_80px_-44px_rgb(0_0_0/0.95)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:rgb(9_9_9_/0.55)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-px rounded-[1.1875rem] ring-1 ring-white/[0.035]" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}

function ShellLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </div>
  );
}

export function LandingShowcaseBento({
  mock = MOCK_SHOWCASE_SHOT,
}: {
  mock?: ShotPreviewData;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-8">
      <PreviewShell className="md:col-span-2 lg:col-span-7">
        <ShellLabel>X · thread + media</ShellLabel>
        <div className="flex justify-center overflow-hidden pb-10 pt-4">
          <div className="origin-top scale-[0.74] md:scale-[0.82] xl:scale-[0.86]">
            <TwitterShot shot={mock} className="shadow-none ring-1 ring-muted-foreground/10" />
          </div>
        </div>
      </PreviewShell>

      <PreviewShell className="md:col-span-1 lg:col-span-5 lg:min-h-[460px]">
        <ShellLabel>Feed · carousel</ShellLabel>
        <div className="flex justify-center overflow-hidden pb-12 pt-4">
          <div className="origin-top scale-[0.82] sm:scale-[0.87] lg:scale-[0.93]">
            <InstaShot shot={mock} className="shadow-none ring-1 ring-muted-foreground/12" />
          </div>
        </div>
      </PreviewShell>

      <PreviewShell className="lg:col-span-6">
        <ShellLabel>Shorts · spine</ShellLabel>
        <div className="flex justify-start overflow-hidden px-4 pb-10 pt-8">
          <div className="origin-top-left scale-[0.68] sm:scale-[0.74] md:scale-[0.82] xl:origin-top xl:translate-x-[2%]">
            <YoutubeShot shot={mock} className="shadow-none ring-1 ring-muted-foreground/14" />
          </div>
        </div>
      </PreviewShell>

      <PreviewShell className="lg:col-span-6">
        <ShellLabel>TikTok · vertical</ShellLabel>
        <div className="flex justify-center overflow-hidden pb-14 pt-8">
          <TikTokShot shot={mock} className="shadow-none ring-1 ring-muted-foreground/18" />
        </div>
      </PreviewShell>
    </div>
  );
}
