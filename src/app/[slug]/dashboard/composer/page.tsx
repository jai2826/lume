"use client";

import { useMutation, useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
  ArrowLeftIcon,
  Check,
  CircleQuestionMarkIcon,
  Image as ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import DashboardHeader from "@/app/[slug]/_components/DashboardHeader";
import { PLATFORM_SETTINGS } from "@/app/[slug]/dashboard/composer/config";
import {
  createDraftsFromLinkedAccounts,
  createEmptyPlatformDrafts,
  getMediaKind,
  isUploadableFile,
  summarizeAttachments,
} from "@/app/[slug]/dashboard/composer/helpers";
import {
  AttachmentStatus,
  ComposerAttachment,
  GeneratePhase,
  PlatformDraft,
  PlatformDraftState,
  ShotPlatformsPayload,
} from "@/app/[slug]/dashboard/composer/types";
import { activeStudioAtom } from "@/atom/studioAtoms";
import { EMPTY_LINKED_ACCOUNTS } from "@/atom/studioCacheAtoms";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCachedStudioLinkedAccounts } from "@/hooks/useStudioCache";
import { PLATFORMS } from "@/lib/constants";
import type { PlatformKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function ComposerPage() {
  const activeStudio = useAtomValue(activeStudioAtom);
  const studioId = activeStudio?.studioId;
  const slug = activeStudio?.slug;

  const createShot = useMutation(api.shots.createShot);
  const studio = useQuery(
    api.studios.getStudioById,
    studioId
      ? { studioId: studioId as Id<"studios"> }
      : "skip",
  );

  const {
    accounts: linkedAccounts,
    isLoading: linkedAccountsLoading,
  } = useCachedStudioLinkedAccounts(studioId);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<
    ComposerAttachment[]
  >([]);
  const [platformDrafts, setPlatformDrafts] =
    useState<PlatformDraftState>(() =>
      createEmptyPlatformDrafts(),
    );
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(
    null,
  );
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  const hasTouchedTargetsRef = useRef(false);
  const didInitializeTargetsRef = useRef(false);

  const statusLabel: Record<AttachmentStatus, string> = {
    ready: "Local",
    uploading: "Uploading...",
    uploaded: "Uploaded",
    error: "Failed",
  };

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (
      !linkedAccounts ||
      hasTouchedTargetsRef.current ||
      didInitializeTargetsRef.current
    )
      return;

    setPlatformDrafts(
      createDraftsFromLinkedAccounts(linkedAccounts),
    );
    didInitializeTargetsRef.current = true;
  }, [linkedAccounts]); // remove isMounted dependency entirely

  const uploadedAttachments = useMemo(
    () =>
      attachments.filter(
        (attachment) =>
          attachment.status === "uploaded" &&
          attachment.publicUrl,
      ),
    [attachments],
  );

  const pendingUploadCount = useMemo(
    () =>
      attachments.filter(
        (attachment) =>
          attachment.status === "ready" ||
          attachment.status === "uploading",
      ).length,
    [attachments],
  );
  const hasAttachmentErrors = useMemo(
    () =>
      attachments.some(
        (attachment) => attachment.status === "error",
      ),
    [attachments],
  );

  const primaryMediaUrl =
    uploadedAttachments[0]?.publicUrl ?? "";
  const renderedLinkedAccounts =
    linkedAccounts ?? EMPTY_LINKED_ACCOUNTS;

  const selectedTargetCount = useMemo(
    () =>
      PLATFORMS.filter(
        (platform) => platformDrafts[platform.key].selected,
      ).length,
    [platformDrafts],
  );
  const connectedTargetCount = useMemo(
    () =>
      PLATFORMS.filter(
        (platform) =>
          (renderedLinkedAccounts[platform.key]?.length ??
            0) > 0,
      ).length,
    [renderedLinkedAccounts],
  );

  const studioName =
    studio?.name ?? activeStudio?.slug ?? "Active studio";
  const studioMemberId = studio?._id ?? studioId;

  const updatePlatformDraft = (
    platform: PlatformKey,
    updates: Partial<PlatformDraft>,
  ) => {
    setPlatformDrafts((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        ...updates,
      },
    }));
  };

  // NOTE: Disable Not Using as of now
  // const uploadAttachment = async (
  //   attachment: ComposerAttachment,
  // ) => {
  //   if (!studioId) {
  //     throw new Error("Select an active studio first.");
  //   }

  //   setAttachments((current) =>
  //     current.map((item) =>
  //       item.id === attachment.id
  //         ? {
  //             ...item,
  //             status: "uploading",
  //             error: undefined,
  //           }
  //         : item,
  //     ),
  //   );

  //   try {
  //     const formData = new FormData();
  //     formData.append("file", attachment.file);
  //     formData.append("studioId", studioId);

  //     const response = await fetch("/api/uploads/r2", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       const payload = (await response
  //         .json()
  //         .catch(() => ({}))) as {
  //         error?: string;
  //       };
  //       throw new Error(
  //         payload.error || "Failed to prepare upload.",
  //       );
  //     }

  //     const payload = (await response.json()) as {
  //       publicUrl: string;
  //     };

  //     setAttachments((current) =>
  //       current.map((item) =>
  //         item.id === attachment.id
  //           ? {
  //               ...item,
  //               status: "uploaded",
  //               publicUrl: payload.publicUrl,
  //               error: undefined,
  //             }
  //           : item,
  //       ),
  //     );

  //     return payload.publicUrl;
  //   } catch (error) {
  //     const message =
  //       error instanceof Error
  //         ? error.message
  //         : "File upload failed.";

  //     setAttachments((current) =>
  //       current.map((item) =>
  //         item.id === attachment.id
  //           ? { ...item, status: "error", error: message }
  //           : item,
  //       ),
  //     );

  //     throw error;
  //   }
  // };

  const ingestFiles = async (files: File[]) => {
    if (!studioId) {
      toast.error("Select an active studio first.");
      return;
    }

    const acceptedFiles = files.filter(isUploadableFile);
    if (!acceptedFiles.length) {
      toast.error("Paste an image,  or audio file.");
      return;
    }

    const newAttachments = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      kind: getMediaKind(file),
      status: "ready" as const,
    }));

    setAttachments((current) => [
      ...current,
      ...newAttachments,
    ]);

    // NOTE: Not running uploadttachment until i click generate button.
    // await Promise.all(
    //   newAttachments.map(async (attachment) => {
    //     try {
    //       await uploadAttachment(attachment);
    //     } catch {
    //       // The attachment stays visible with an error state so it can be retried.
    //     }
    //   }),
    // );
  };

  // const retryAttachment = (attachmentId: string) => {
  //   const attachment = attachmentsRef.current.find(
  //     (item) => item.id === attachmentId,
  //   );

  //   if (!attachment) {
  //     return;
  //   }

  //   void uploadAttachment(attachment).catch(() => {
  //     // The attachment row already reflects the error state.
  //   });
  // };

  const removeAttachment = (attachmentId: string) => {
    const attachment = attachmentsRef.current.find(
      (item) => item.id === attachmentId,
    );

    if (attachment) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    setAttachments((current) =>
      current.filter((item) => item.id !== attachmentId),
    );
  };

  const toggleTarget = (platform: PlatformKey) => {
    const connected =
      (linkedAccounts?.[platform]?.length ?? 0) > 0;
    if (!connected) {
      return;
    }

    hasTouchedTargetsRef.current = true;
    updatePlatformDraft(platform, {
      selected: !platformDrafts[platform].selected,
    });
  };

  // Add to state:
  const [generatePhase, setGeneratePhase] =
    useState<GeneratePhase>("idle");

  const generateLabel: Record<GeneratePhase, string> = {
    idle: "Generate prompts & images",
    uploading: "Uploading files...",
    generating: "Generating prompts & images...",
    done: "Regenerate prompts & images",
  };

  const isGenerating =
    generatePhase === "uploading" ||
    generatePhase === "generating";

  const handleGenerate = async () => {
    if (!studioId) {
      toast.error("Select an active studio first.");
      return;
    }
    if (!text.trim() && !attachments.length) {
      toast.error("Paste a prompt or drop media first.");
      return;
    }

    setGeneratePhase("uploading");

    try {
      // ── Phase 1: Upload all ready attachments ──────────────
      const ready = attachments.filter(
        (a) => a.status === "ready",
      );

      if (ready.length) {
        // Mark all ready as uploading
        setAttachments((current) =>
          current.map((a) =>
            a.status === "ready"
              ? { ...a, status: "uploading" }
              : a,
          ),
        );

        const results = await Promise.allSettled(
          ready.map(async (attachment) => {
            const formData = new FormData();
            formData.append("file", attachment.file);
            formData.append("studioId", studioId);

            const res = await fetch("/api/uploads/r2", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const payload = (await res
                .json()
                .catch(() => ({}))) as { error?: string };
              throw new Error(
                payload.error ?? "Upload failed.",
              );
            }

            const payload = (await res.json()) as {
              publicUrl: string;
              key: string;
            };

            // Mark this specific attachment as uploaded
            setAttachments((current) =>
              current.map((a) =>
                a.id === attachment.id
                  ? {
                      ...a,
                      status: "uploaded",
                      publicUrl: payload.publicUrl,
                      tempKey: payload.key,
                    }
                  : a,
              ),
            );

            return {
              id: attachment.id,
              publicUrl: payload.publicUrl,
              key: payload.key,
            };
          }),
        );

        // Check for any failures
        const failed = results.filter(
          (r) => r.status === "rejected",
        );
        if (failed.length) {
          // Mark failed attachments
          ready.forEach((attachment, index) => {
            if (results[index].status === "rejected") {
              const reason = (
                results[index] as PromiseRejectedResult
              ).reason as Error;
              setAttachments((current) =>
                current.map((a) =>
                  a.id === attachment.id
                    ? {
                        ...a,
                        status: "error",
                        error: reason.message,
                      }
                    : a,
                ),
              );
            }
          });

          toast.error(
            `${failed.length} file(s) failed to upload. Remove them and try again.`,
          );
          setGeneratePhase("idle");
          return;
        }

        toast.success("Files uploaded successfully.");
      }

      // ── Phase 2: Generate prompts and images ────────────────
      setGeneratePhase("generating");

      const currentAttachments = attachmentsRef.current;
      const uploadedAttachments = currentAttachments.filter(
        (a) => a.status === "uploaded" && a.publicUrl,
      );
      const referenceImages = uploadedAttachments
        .filter((attachment) => attachment.kind === "image")
        .map((attachment) => ({
          url: attachment.publicUrl!,
          mimeType: attachment.file.type || "image/png",
        }));

      const response = await fetch(
        "/api/composer/generate",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            studioId,
            title: title.trim(),
            text: text.trim(),
            attachments: referenceImages,
            platforms: PLATFORMS.map((platform) => {
              const current = platformDrafts[platform.key];
              return {
                key: platform.key,
                selected: current.selected,
                postType:
                  current.postType ||
                  PLATFORM_SETTINGS[platform.key]
                    .defaultPostType,
                notes: current.notes,
              };
            }),
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          payload.error ?? "Generate failed.",
        );
      }

      const payload = (await response.json()) as {
        prompts?: Partial<
          Record<
            PlatformKey,
            {
              aiPrompt: string;
              generatedImageUrl?: string;
            }
          >
        >;
      };

      setPlatformDrafts((current) => {
        const nextDrafts = { ...current };

        PLATFORMS.forEach((platform) => {
          const generated = payload.prompts?.[platform.key];
          if (!generated) {
            return;
          }

          const existing = nextDrafts[platform.key];
          nextDrafts[platform.key] = {
            ...existing,
            aiPrompt: generated.aiPrompt,
            generatedImageUrl:
              generated.generatedImageUrl ?? "",
            referenceImageUrls: referenceImages.map(
              (image) => image.url,
            ),
            status: generated.aiPrompt ? "ready" : "idle",
          };
        });

        return nextDrafts;
      });

      setGeneratePhase("done");
      console.log(
        "Generate prompts and images response:",
        payload,
        platformDrafts,
      );
      toast.success("Prompts and images generated.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Generate failed.",
      );
      setGeneratePhase("idle");
    }
  };

  const handleCreate = async () => {
    if (!studioId)
      return toast.error("Select an active studio first.");

    if (!text.trim() && !attachments.length) {
      return toast.error(
        "Paste a prompt or attach media first.",
      );
    }

    // If user added files after generating, block until they regenerate
    const hasUnuploadedFiles = attachments.some(
      (a) => a.status === "ready",
    );
    if (hasUnuploadedFiles) {
      return toast.error(
        "Hit Generate first to upload and draft your new files.",
      );
    }

    const hasFailedFiles = attachments.some(
      (a) => a.status === "error",
    );
    if (hasFailedFiles) {
      return toast.error(
        "Remove failed attachments before creating the shot.",
      );
    }
    if (hasAttachmentErrors) {
      return toast.error(
        "Retry or remove failed attachments before creating the shot.",
      );
    }

    const selectedPlatforms = PLATFORMS.filter(
      (platform) => platformDrafts[platform.key].selected,
    );

    const currentAttachments = attachmentsRef.current;
    const uploadedAttachments = currentAttachments.filter(
      (a) => a.status === "uploaded" && a.publicUrl,
    );
    const referenceImages = uploadedAttachments
      .filter((attachment) => attachment.kind === "image")
      .map((attachment) => ({
        url: attachment.publicUrl!,
        mimeType: attachment.file.type || "image/png",
      }));

    const inputs: {
      text: string;
      images?: string[];
      videos?: string[];
      audios?: string[];
    } = { text: text.trim() };

    const promptText =
      text.trim() || title.trim() || "Media-led shot draft";

    const uploadedImageUrls = uploadedAttachments
      .filter((attachment) => attachment.kind === "image")
      .map((attachment) => attachment.publicUrl!)
      .filter(Boolean);
    const uploadedVideoUrls = uploadedAttachments
      .filter((attachment) => attachment.kind === "video")
      .map((attachment) => attachment.publicUrl!)
      .filter(Boolean);
    const uploadedAudioUrls = uploadedAttachments
      .filter((attachment) => attachment.kind === "audio")
      .map((attachment) => attachment.publicUrl!)
      .filter(Boolean);

    inputs.text = promptText;
    if (uploadedImageUrls.length)
      inputs.images = uploadedImageUrls;
    if (uploadedVideoUrls.length)
      inputs.videos = uploadedVideoUrls;
    if (uploadedAudioUrls.length)
      inputs.audios = uploadedAudioUrls;

    let nextDrafts = platformDrafts;

    if (selectedPlatforms.length) {
      const response = await fetch(
        "/api/composer/generate",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            studioId,
            title: title.trim(),
            text: text.trim(),
            attachments: referenceImages,
            platforms: selectedPlatforms.map((platform) => {
              const current = platformDrafts[platform.key];
              return {
                key: platform.key,
                selected: current.selected,
                postType:
                  current.postType ||
                  PLATFORM_SETTINGS[platform.key]
                    .defaultPostType,
                notes: current.notes,
              };
            }),
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          payload.error ?? "Generate failed.",
        );
      }

      const payload = (await response.json()) as {
        prompts?: Partial<
          Record<
            PlatformKey,
            {
              aiPrompt: string;
              generatedImageUrl?: string;
            }
          >
        >;
      };

      nextDrafts = { ...platformDrafts };

      PLATFORMS.forEach((platform) => {
        const generated = payload.prompts?.[platform.key];
        if (!generated) {
          return;
        }

        const existing = nextDrafts[platform.key];
        nextDrafts[platform.key] = {
          ...existing,
          aiPrompt: generated.aiPrompt,
          generatedImageUrl:
            generated.generatedImageUrl ?? "",
          referenceImageUrls: referenceImages.map(
            (image) => image.url,
          ),
          status: generated.aiPrompt
            ? "ready"
            : existing.status,
        };
      });

      setPlatformDrafts(nextDrafts);
    }

    const platforms: ShotPlatformsPayload =
      PLATFORMS.reduce((result, platform) => {
        const draft = nextDrafts[platform.key];
        const generatedText = draft.generatedText.trim();
        const aiPrompt = draft.aiPrompt.trim();

        result[platform.key] = {
          status:
            draft.selected && (generatedText || aiPrompt)
              ? "ready"
              : "idle",
          selected: draft.selected,
          postType: draft.postType.trim() || undefined,
          notes: draft.notes.trim() || undefined,
          generatedText: generatedText || undefined,
          aiPrompt: aiPrompt || undefined,
          generatedImageUrl:
            draft.generatedImageUrl || undefined,
          referenceImageUrls: draft.referenceImageUrls
            .length
            ? draft.referenceImageUrls
            : undefined,
          mediaAssetUrl:
            draft.mediaAssetUrl ||
            primaryMediaUrl ||
            undefined,
        };

        return result;
      }, {} as ShotPlatformsPayload);

    setLoading(true);
    try {
      await createShot({
        title: title.trim() || undefined,
        inputs,
        platforms,
        studioId: studioId as Id<"studios">,
      });

      toast.success(
        selectedPlatforms.length
          ? "Media generated."
          : "Shot saved.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create shot.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const files = Array.from(
      event.clipboardData.files ?? [],
    );
    if (!files.length) {
      return;
    }

    event.preventDefault();
    void ingestFiles(files);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const files = Array.from(
      event.dataTransfer.files ?? [],
    );
    if (!files.length) {
      return;
    }

    void ingestFiles(files);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <DashboardHeader
          tag="Composer"
          heading="Shot composer"
          description="Paste copy and media like a chat. Uploads happen automatically, and each social network gets its own draft card."
          CustomButtons={[
            <Button
              key="back"
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={`/${slug ?? "activestudios"}/dashboard/shots`}>
                  <ArrowLeftIcon />
                  Back to shots
                </Link>
              }
            />,
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="rounded-2xl pt-0 ">
            <CardHeader className=" border-b pt-4 border-border/60 bg-muted/20">
              <div className=" flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Compose with files</CardTitle>
                  <CardDescription className="lg:line-clamp-2">
                    Paste images, videos, or audio directly
                    into the prompt area. Multiple files
                    upload together and stay visible as
                    previews.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={
                    isGenerating ||
                    (!text.trim() &&
                      attachments.length === 0)
                  }
                  className="bg-brand text-white">
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generateLabel[generatePhase]}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="flex gap-3 items-start self-start ">
                <div className="w-full">
                  <label className="ml-1 text-sm font-medium text-foreground/80">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="Short internal title"
                    className="mt-2 rounded-lg"
                  />
                </div>
              </div>

              <div
                className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-4"
                onDrop={handleDrop}
                onDragOver={(event) =>
                  event.preventDefault()
                }>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      Prompt and paste area
                    </div>
                    <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
                      Paste text like a chat prompt. If your
                      clipboard contains files, they upload
                      automatically and render below without
                      leaving the page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openFilePicker}>
                      <Plus className="h-4 w-4" />
                      Browse files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,audio/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const files = Array.from(
                          event.target.files ?? [],
                        );
                        if (files.length) {
                          void ingestFiles(files);
                        }
                        event.target.value = "";
                      }}
                    />
                  </div>
                </div>

                <Textarea
                  value={text}
                  onChange={(event) =>
                    setText(event.target.value)
                  }
                  onPaste={handlePaste}
                  placeholder="Write the core prompt here, then paste files directly into this box."
                  className="mt-4 min-h-36 rounded-2xl border-border/70 bg-background/80 text-sm leading-6"
                />

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    Files stay local until Generate
                  </Badge>
                  <Badge variant="outline">
                    Paste or browse to attach
                  </Badge>
                  <Badge variant="outline">
                    Multi-file supported
                  </Badge>
                </div>
              </div>

              {attachments.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        Attached media
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {summarizeAttachments(
                          attachments,
                        ) ||
                          `${attachments.length} file(s)`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pendingUploadCount
                        ? `${pendingUploadCount} uploading`
                        : hasAttachmentErrors
                          ? "Resolve failed uploads"
                          : "All files uploaded"}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {attachments.map((attachment) => (
                      <AttachmentPreviewCard
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() =>
                          removeAttachment(attachment.id)
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={
                    <Link
                      href={`/${slug ?? "activestudios"}/dashboard/shots`}>
                      Cancel
                    </Link>
                  }
                />
                <Button
                  onClick={handleCreate}
                  disabled={
                    loading ||
                    isGenerating ||
                    pendingUploadCount > 0
                  }
                  className="bg-brand text-white">
                  {loading ? "Creating..." : "Create shot"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl pt-0">
            <CardHeader className="pt-4 border-b border-border/60 bg-muted/20">
              <div className=" flex  gap-4  items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Publish targets</CardTitle>
                  <CardDescription className="lg:line-clamp-2 ">
                    Toggle the social networks you want to
                    publish to. Unconnected networks stay
                    disabled.
                  </CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <CircleQuestionMarkIcon className="ml-2 h-6 w-6 text-foreground/80" />
                  </TooltipTrigger>
                  <TooltipContent
                    className={
                      "rounded-2xl flex flex-col items-start border border-border/60 bg-card px-4 py-3 text-sm"
                    }>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Target summary
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      `${selectedTargetCount} selected / $
                      {connectedTargetCount} connected`
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected networks are enabled by
                      default. Locked targets stay disabled
                      until an account is linked.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="border-b pb-4 flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-1">
                {PLATFORMS.map((platform) => {
                  const draft =
                    platformDrafts[platform.key];
                  const connected =
                    (renderedLinkedAccounts[platform.key]
                      ?.length ?? 0) > 0;

                  return (
                    <Button
                      key={platform.key}
                      type="button"
                      size="sm"
                      disabled={!connected}
                      onClick={() =>
                        toggleTarget(platform.key)
                      }
                      className={cn(
                        "rounded-full px-4 bg-primary hover:cursor-pointer",
                        !connected &&
                          "opacity-50 cursor-not-allowed",
                        draft.selected &&
                          "bg-brand text-white",
                      )}>
                      <platform.icon className="h-3.5 w-3.5" />
                      {platform.label}
                      {draft.selected ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                    </Button>
                  );
                })}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Always check the type of each social media
                  draft before generating.
                </p>
              </div>
            </CardContent>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      Platform drafts
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Each social network has its own
                      editable settings, prompt brief, and
                      generated image.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {PLATFORMS.map((platform) => {
                    const draft =
                      platformDrafts[platform.key];
                    const connected =
                      (renderedLinkedAccounts[platform.key]
                        ?.length ?? 0) > 0;

                    return (
                      <PlatformDraftCard
                        key={platform.key}
                        platform={platform}
                        connected={
                          (renderedLinkedAccounts[
                            platform.key
                          ]?.length ?? 0) > 0
                        }
                        draft={platformDrafts[platform.key]}
                        onPostTypeChange={(value) =>
                          updatePlatformDraft(
                            platform.key,
                            {
                              postType: value,
                            },
                          )
                        }
                        onNotesChange={(value) =>
                          updatePlatformDraft(
                            platform.key,
                            {
                              notes: value,
                            },
                          )
                        }
                        onGeneratedTextChange={(value) =>
                          updatePlatformDraft(
                            platform.key,
                            {
                              generatedText: value,
                            },
                          )
                        }
                        onAiPromptChange={(value) =>
                          updatePlatformDraft(
                            platform.key,
                            {
                              aiPrompt: value,
                            },
                          )
                        }
                        onGeneratedImageUrlChange={(
                          value,
                        ) =>
                          updatePlatformDraft(
                            platform.key,
                            {
                              generatedImageUrl: value,
                            },
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="border-border/70 bg-background/85 backdrop-blur">
              <CardHeader>
                <CardTitle>Composer summary</CardTitle>
                <CardDescription>
                  Studio context, upload state, and platform
                  selection at a glance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow
                  label="Studio"
                  value={studioName}
                />
                <DetailRow
                  label="Studio ID"
                  value={String(
                    studioMemberId ?? "unknown",
                  )}
                />
                <DetailRow
                  label="Attachments"
                  value={`${attachments.length} file${attachments.length === 1 ? "" : "s"}`}
                />
                <DetailRow
                  label="Uploads"
                  value={
                    pendingUploadCount
                      ? `${pendingUploadCount} pending`
                      : "Ready"
                  }
                />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/85 backdrop-blur">
              <CardHeader>
                <CardTitle>How the drafts work</CardTitle>
                <CardDescription>
                  The generate button fills every platform
                  card with tailored copy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <PreviewRule
                  icon={Sparkles}
                  label="Generate"
                  text="Creates a platform-specific draft for every social network card."
                />
                <PreviewRule
                  icon={Upload}
                  label="Paste files"
                  text="Clipboard images, videos, and audio files upload automatically."
                />
                <PreviewRule
                  icon={File}
                  label="Multiple files"
                  text="You can paste or browse several files and keep all previews visible."
                />
                <PreviewRule
                  icon={Loader2}
                  label="Connected targets"
                  text="Networks with no linked account remain disabled until you connect one."
                />
              </CardContent>
            </Card>
          </div> */}
        </div>
      </div>
    </div>
  );
}

function AttachmentPreviewCard({
  attachment,
  // onRetry,
  onRemove,
}: {
  attachment: ComposerAttachment;
  // onRetry: () => void;
  onRemove: () => void;
}) {
  const statusVariant =
    attachment.status === "uploaded"
      ? "secondary"
      : attachment.status === "error"
        ? "destructive"
        : "outline";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/85 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="relative h-40 overflow-hidden bg-muted/20">
        {attachment.kind === "image" ? (
          <img
            src={attachment.previewUrl}
            alt={attachment.file.name}
            className="h-full w-full object-cover"
          />
        ) : attachment.kind === "video" ? (
          <video
            controls
            className="h-full w-full object-cover bg-black"
            src={attachment.previewUrl}
          />
        ) : attachment.kind === "audio" ? (
          <div className="flex h-full items-center justify-center p-4">
            <audio
              controls
              className="w-full"
              src={attachment.previewUrl}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <div className="space-y-2">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/80" />
              <p>Unsupported file preview</p>
            </div>
          </div>
        )}

        <div className="absolute right-3 top-3">
          <Badge variant={statusVariant}>
            {attachment.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {attachment.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {attachment.kind} ·{" "}
              {formatBytes(attachment.file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {attachment.error ? (
          <p className="text-xs text-destructive">
            {attachment.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {/* {attachment.status === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}>
              Retry
            </Button>
          ) : null} */}
          {attachment.publicUrl ? (
            <a
              href={attachment.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline">
              Open uploaded file
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlatformDraftCard({
  platform,
  connected,
  draft,
  onPostTypeChange,
  onNotesChange,
  onGeneratedTextChange,
  onAiPromptChange,
  onGeneratedImageUrlChange,
}: {
  platform: (typeof PLATFORMS)[number];
  connected: boolean;
  draft: PlatformDraft;
  onPostTypeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onGeneratedTextChange: (value: string) => void;
  onAiPromptChange: (value: string) => void;
  onGeneratedImageUrlChange: (value: string) => void;
}) {
  const Icon = platform.icon;

  if (!connected) {
    return null;
  }

  return (
    <Card className="pb-0 border-border/60 bg-background/80 rounded-2xl">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm",
                `bg-linear-to-br ${platform.accent}`,
              )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                {platform.label}
              </CardTitle>
              <CardDescription>
                {PLATFORM_SETTINGS[platform.key].hint}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={connected ? "secondary" : "outline"}>
              {connected ? "Connected" : "Locked"}
            </Badge>
            <Badge
              variant={
                draft.selected ? "default" : "outline"
              }>
              {draft.selected ? "Selected" : "Muted"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {draft.generatedImageUrl ? (
        <div className="px-6 pb-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
            <div className="border-b border-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Generated media preview
            </div>
            <a
              href={draft.generatedImageUrl}
              target="_blank"
              rel="noreferrer"
              className="block">
              <img
                src={draft.generatedImageUrl}
                alt={`${platform.label} generated media`}
                className="h-auto w-full object-cover"
              />
            </a>
            <div className="px-3 py-2">
              <a
                href={draft.generatedImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-medium text-primary hover:underline">
                Open generated image
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <CardContent
        className={cn(
          "space-y-4 transition-all duration-300 ease-in-out overflow-hidden",
          draft.selected
            ? "max-h-200 opacity-100"
            : "max-h-0 opacity-0 py-0",
        )}>
        <div>
          <Label className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Post type
          </Label>
          <Select
            value={draft.postType}
            onValueChange={(value) =>
              onPostTypeChange(value!)
            }>
            <SelectTrigger className="mt-2 rounded-sm  w-full">
              <SelectValue placeholder="Select post type" />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              className={"m-0 p-2  rounded-sm"}>
              {PLATFORM_SETTINGS[platform.key].options.map(
                (type) => (
                  <SelectItem
                    className={
                      "rounded-sm! hover:bg-accent/50 p-2 my-0.5"
                    }
                    key={type}
                    value={type}>
                    {type}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Notes for this platform
          </Label>
          <Textarea
            value={draft.notes}
            onChange={(event) =>
              onNotesChange(event.target.value)
            }
            placeholder="Add platform-specific instructions or reminders."
            className="mt-2 min-h-20 text-sm"
          />
        </div>

        <div className={" mb-4"}>
          <label className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Draft copy
          </label>
          <Textarea
            value={draft.generatedText}
            onChange={(event) =>
              onGeneratedTextChange(event.target.value)
            }
            placeholder="Optional manual copy for this platform draft."
            className="mt-2 min-h-36 text-sm leading-6"
          />
        </div>

        <div className="mb-4">
          <label className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            AI prompt
          </label>
          <Textarea
            value={draft.aiPrompt}
            onChange={(event) =>
              onAiPromptChange(event.target.value)
            }
            placeholder="Click Generate prompts & images to create a platform-specific brief."
            className="mt-2 min-h-28 text-sm leading-6"
          />
        </div>

        <div className="mb-4">
          <label className="ml-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Generated image URL
          </label>
          <Textarea
            value={draft.generatedImageUrl}
            onChange={(event) =>
              onGeneratedImageUrlChange(event.target.value)
            }
            placeholder="Generated image will appear here after Gemini finishes."
            className="mt-2 min-h-20 text-sm leading-6"
          />
        </div>

        {draft.referenceImageUrls.length ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Reference images
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.referenceImageUrls.map(
                (url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium text-primary hover:underline">
                    Image {index + 1}
                  </a>
                ),
              )}
            </div>
          </div>
        ) : null}

        {draft.mediaAssetUrl ? (
          <a
            href={draft.mediaAssetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs font-medium text-primary hover:underline">
            Open attached media
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function PreviewRule({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">
          {label}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
