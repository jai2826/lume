import { PLATFORM_SETTINGS } from "@/app/[slug]/dashboard/composer/config";
import {
    ComposerAttachment,
    PlatformDraftState,
    UploadedMediaKind,
} from "@/app/[slug]/dashboard/composer/types";
import {
    EMPTY_LINKED_ACCOUNTS,
    LinkedAccountsSnapshot,
} from "@/atom/studioCacheAtoms";
import { PLATFORMS } from "@/lib/constants";
import { PlatformKey } from "@/lib/types";

export function createEmptyPlatformDrafts(): PlatformDraftState {
  return PLATFORMS.reduce((drafts, platform) => {
    drafts[platform.key] = {
      selected: false,
      postType:
        PLATFORM_SETTINGS[platform.key].defaultPostType,
      notes: "",
      generatedText: "",
      aiPrompt: "",
      generatedImageUrl: "",
      referenceImageUrls: [],
      status: "idle",
      mediaAssetUrl: "",
    };
    return drafts;
  }, {} as PlatformDraftState);
}

export function createDraftsFromLinkedAccounts(
  accounts: LinkedAccountsSnapshot = EMPTY_LINKED_ACCOUNTS,
): PlatformDraftState {
  return PLATFORMS.reduce((drafts, platform) => {
    drafts[platform.key] = {
      selected: accounts[platform.key].length > 0,
      postType:
        PLATFORM_SETTINGS[platform.key].defaultPostType,
      notes: "",
      generatedText: "",
      aiPrompt: "",
      generatedImageUrl: "",
      referenceImageUrls: [],
      status: "idle",
      mediaAssetUrl: "",
    };
    return drafts;
  }, {} as PlatformDraftState);
}

export function isUploadableFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("audio/")
    // file.type.startsWith("video/") //NOTE: Temporarily disabling video uploads until we have a better UX around upload progress and failure states.
  );
}

export function getMediaKind(
  file: File,
): UploadedMediaKind {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "file";
}

export function summarizeAttachments(
  attachments: ComposerAttachment[],
) {
  if (!attachments.length) return "";

  const counts = attachments.reduce(
    (acc, attachment) => {
      acc[attachment.kind] += 1;
      return acc;
    },
    { image: 0, video: 0, audio: 0, file: 0 },
  );

  const summary: string[] = [];
  if (counts.image)
    summary.push(
      `${counts.image} image${counts.image > 1 ? "s" : ""}`,
    );
  if (counts.video)
    summary.push(
      `${counts.video} video${counts.video > 1 ? "s" : ""}`,
    );
  if (counts.audio)
    summary.push(
      `${counts.audio} audio${counts.audio > 1 ? "s" : ""}`,
    );
  if (counts.file)
    summary.push(
      `${counts.file} file${counts.file > 1 ? "s" : ""}`,
    );

  return summary.join(", ");
}

export function buildGeneratedCopy({
  platform,
  title,
  text,
  postType,
  attachments,
}: {
  platform: PlatformKey;
  title: string;
  text: string;
  postType: string;
  attachments: ComposerAttachment[];
}) {
  const platformLabel =
    PLATFORMS.find((entry) => entry.key === platform)
      ?.label ?? platform;
  const attachmentSummary =
    summarizeAttachments(attachments) ||
    "no media attached yet";
  const sourceText = text.trim() || title.trim();
  const fallback = `Turn this into a polished ${postType.toLowerCase()} for ${platformLabel}.`;

  const leadByPlatform: Record<PlatformKey, string> = {
    instagram:
      "Lead with a visual hook and end with a clear CTA.",
    youtube:
      "Open with the payoff, then make the next step obvious.",
    x: "Keep the first line sharp and make the value instantly legible.",
    tiktok: "Start with motion, contrast, or curiosity.",
    snapchat: "Keep it native, quick, and story-first.",
  };

  const followUpByPlatform: Record<PlatformKey, string> = {
    instagram:
      "Add 3 to 5 relevant hashtags and a conversational caption.",
    youtube:
      "Include a title, description, and a keyword-friendly CTA.",
    x: "Make every line earn its place and trim any filler.",
    tiktok:
      "Keep the copy energetic and write like a creator, not a brand.",
    snapchat:
      "Write like a fast status update with light context.",
  };

  return [
    `${platformLabel} ${postType}`,
    leadByPlatform[platform],
    sourceText ? `Source: ${sourceText}` : fallback,
    `Media: ${attachmentSummary}.`,
    followUpByPlatform[platform],
  ].join("\n");
}

export function buildGeneratedAiPrompt({
  platform,
  title,
  text,
  postType,
  notes,
  attachments,
}: {
  platform: PlatformKey;
  title: string;
  text: string;
  postType: string;
  notes: string;
  attachments: ComposerAttachment[];
}) {
  const platformLabel =
    PLATFORMS.find((entry) => entry.key === platform)
      ?.label ?? platform;
  const platformPrompt = PLATFORM_SETTINGS[platform].prompt;
  const attachmentSummary =
    summarizeAttachments(attachments) ||
    "no media attached yet";
  const sourceText = text.trim() || title.trim();
  const noteText = notes.trim();

  return [
    `Create a ${postType.toLowerCase()} concept for ${platformLabel}.`,
    `Visual direction: ${platformPrompt}`,
    sourceText
      ? `Core prompt: ${sourceText}`
      : "Core prompt: focus on the strongest benefit in the input.",
    `Reference media: ${attachmentSummary}.`,
    noteText ? `Platform notes: ${noteText}` : "",
    "Return a concise image brief with one clear focal point, readable text treatment when useful, and platform-native framing.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getReferenceImageUrls(
  attachments: ComposerAttachment[],
) {
  const imageUrls = attachments
    .filter(
      (attachment) =>
        attachment.kind === "image" &&
        Boolean(attachment.publicUrl),
    )
    .map((attachment) => attachment.publicUrl as string);

  if (imageUrls.length) {
    return imageUrls;
  }

  const fallback = attachments.find(
    (attachment) => Boolean(attachment.publicUrl),
  );

  return fallback?.publicUrl ? [fallback.publicUrl] : [];
}
