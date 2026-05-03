/** Client-side preview model aligned with Convex `shots` documents. */

export type ShotPlatformEntry = {
  status: "idle" | "generating" | "ready";
  generatedText: string;
  mediaAssetUrl: string;
};

export type ShotPlatforms = {
  twitter: ShotPlatformEntry;
  instagram: ShotPlatformEntry;
  youtube: ShotPlatformEntry;
  tiktok: ShotPlatformEntry;
  snapchat: ShotPlatformEntry;
};

export type ShotInputs = {
  text: string;
  images: string[];
  videos: string[];
};

export type ShotPreviewData = {
  title?: string;
  inputs: ShotInputs;
  platforms: ShotPlatforms;
};

export function previewBodyText(inputs: ShotInputs, platform: ShotPlatformEntry) {
  if (platform.status === "ready" && platform.generatedText.trim()) {
    return platform.generatedText.trim();
  }
  return inputs.text.trim();
}

/** Single best URL for timeline-style single attachments (X, TikTok sidebar, Shorts thumb). */
export function primaryMediaUrl(inputs: ShotInputs, platform: ShotPlatformEntry): string | undefined {
  const u =
    platform.mediaAssetUrl.trim() ||
    inputs.videos[0] ||
    inputs.images[0] ||
    "";
  return u ? u : undefined;
}

export function isLikelyVideoUrl(url: string) {
  if (!url) return false;
  return (
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ||
    url.includes("/video/")
  );
}

export function carouselImageUrls(inputs: ShotInputs, platform: ShotPlatformEntry): string[] {
  if (inputs.images.length > 0) return inputs.images;
  const solo = platform.mediaAssetUrl.trim();
  if (
    solo &&
    !isLikelyVideoUrl(solo) &&
    solo !== inputs.videos[0]
  ) {
    return [solo];
  }
  return [];
}

export function carouselOrVideo(inputs: ShotInputs, platform: ShotPlatformEntry) {
  const images = carouselImageUrls(inputs, platform);
  const vid =
    (platform.mediaAssetUrl.trim() && isLikelyVideoUrl(platform.mediaAssetUrl)
      ? platform.mediaAssetUrl.trim()
      : undefined) ??
    inputs.videos[0] ??
    undefined;
  return { images, videoUrl: vid };
}
