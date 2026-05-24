import { PlatformKey } from "@/lib/types";

export const PLATFORM_SETTINGS: Record<
  PlatformKey,
  {
    defaultPostType: string;
    options: string[];
    hint: string;
    prompt: string;
  }
> = {
  instagram: {
    defaultPostType: "Reel",
    options: ["Reel", "Story", "Post", "Carousel"],
    hint: "Feed-native, visual, and punchy.",
    prompt:
      "Lead with a visual hook and end with a clear CTA.",
  },
  youtube: {
    defaultPostType: "Short",
    options: ["Short", "Video", "Community post"],
    hint: "Built for search, retention, and clarity.",
    prompt:
      "Open fast, explain the payoff, then suggest the next click.",
  },
  x: {
    defaultPostType: "Post",
    options: ["Post", "Thread"],
    hint: "Tight copy with a sharp opening line.",
    prompt:
      "Keep the first line crisp and make the value obvious.",
  },
  tiktok: {
    defaultPostType: "Video",
    options: ["Video", "Photo post"],
    hint: "Fast pacing with creator-style framing.",
    prompt:
      "Start with motion or a strong claim, then keep the energy moving.",
  },
  snapchat: {
    defaultPostType: "Story",
    options: ["Story", "Spotlight", "Post"],
    hint: "Casual, quick, and story-first.",
    prompt:
      "Write like a native story update with a lightweight CTA.",
  },
};