import { PlatformKey } from "@/lib/types";


export type UploadedMediaKind =
  | "image"
  | "video"
  | "audio"
  | "file";

export type AttachmentStatus =
  | "ready"
  | "uploading"
  | "uploaded"
  | "error";

export type ComposerAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  kind: UploadedMediaKind;
  status: AttachmentStatus;
  publicUrl?: string;
  error?: string;
};

export type PlatformDraft = {
  selected: boolean;
  postType: string;
  notes: string;
  generatedText: string;
  status: "idle" | "generating" | "ready";
  mediaAssetUrl: string;
};

export type PlatformDraftState = Record<
  PlatformKey,
  PlatformDraft
>;

export  type ShotPlatformPayload = {
  status:
    | "idle"
    | "generating"
    | "ready"
    | "published"
    | "failed";
  selected: boolean;
  postType?: string;
  notes?: string;
  generatedText?: string;
  mediaAssetUrl?: string;
};

export type ShotPlatformsPayload = Record<
  PlatformKey,
  ShotPlatformPayload
>;

export  type GeneratePhase =
    | "idle"
    | "uploading"
    | "generating"
    | "done";