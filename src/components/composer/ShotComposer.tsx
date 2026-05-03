"use client";

import { api } from "../../../convex/_generated/api";
import {
  type ConvexReactClient,
  useConvex,
  useMutation,
} from "convex/react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  CirclePlay,
  FileImageIcon,
  ImagePlus,
  Trash2,
  Loader2Icon,
  Sparkles,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

const ACCEPT_MEDIA = "image/*,video/*";

type TrayKind = "image" | "video";

interface TrayAsset {
  id: string;
  kind: TrayKind;
  file: File;
  previewUrl: string;
}

function isTrayKind(file: File): TrayKind | null {
  const t = file.type;
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  return null;
}

function collectFiles(dt: DataTransfer | null): File[] {
  if (!dt?.files?.length) return [];
  return Array.from(dt.files).filter((f) => isTrayKind(f) !== null);
}

async function uploadFileAndGetUrl(
  convex: ConvexReactClient,
  file: File,
): Promise<string> {
  const postUrl = await convex.mutation(api.files.generateUploadUrl, {});
  const res = await fetch(postUrl, {
    method: "POST",
    headers: file.type ? { "Content-Type": file.type } : {},
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const json = (await res.json()) as { storageId: Id<"_storage"> };
  const url = await convex.query(api.files.storageUrl, {
    storageId: json.storageId,
  });
  if (!url) throw new Error("Could not resolve storage URL.");
  return url;
}

export function ShotComposer({
  className,
  onShotCreated,
}: {
  className?: string;
  /** Fires with the Convex id after `createShot` succeeds (URLs already uploaded). */
  onShotCreated?: (shotId: Id<"shots">) => void;
}) {
  const convex = useConvex();
  const createShot = useMutation(api.shots.createShot);
  const composerId = useId();
  const textareaDomId = `${composerId}-body`;

  const [text, setText] = useState("");
  const [assets, setAssets] = useState<TrayAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const revokePreviewsFor = useCallback((list: TrayAsset[]) => {
    for (const a of list) {
      URL.revokeObjectURL(a.previewUrl);
    }
  }, []);

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setSubmitError(null);
    setAssets((prev) => {
      const nu: TrayAsset[] = [];
      for (const file of files) {
        const kind = isTrayKind(file);
        if (!kind) continue;
        nu.push({
          id: crypto.randomUUID(),
          kind,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      if (nu.length === 0) return prev;
      return [...prev, ...nu];
    });
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => {
      const rm = prev.find((a) => a.id === id);
      if (rm) URL.revokeObjectURL(rm.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const onDropShell = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      addFiles(collectFiles(e.dataTransfer));
    },
    [addFiles],
  );

  const clearAll = useCallback(() => {
    setAssets((prev) => {
      revokePreviewsFor(prev);
      return [];
    });
  }, [revokePreviewsFor]);

  const handleGenerate = useCallback(async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const images: string[] = [];
      const videos: string[] = [];
      for (const asset of assets) {
        const url = await uploadFileAndGetUrl(convex, asset.file);
        if (asset.kind === "image") images.push(url);
        else videos.push(url);
      }
      const shotId = await createShot({
        inputs: {
          text: text.trim(),
          images,
          videos,
        },
      });
      onShotCreated?.(shotId);
      clearAll();
      setText("");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [assets, convex, createShot, text, clearAll, onShotCreated]);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-px shadow-xl shadow-black/25",
        className,
      )}
    >
      <div
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDrop={onDropShell}
        className={cn(
          "rounded-[0.9375rem] bg-background/85 p-5 backdrop-blur-xl transition-[box-shadow]",
          isDragging &&
            "ring-2 ring-brand-accent/30 ring-offset-2 ring-offset-background",
        )}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-3">
            <div>
              <h2 className="text-[0.8125rem] font-semibold tracking-tight">
                Compose shot
              </h2>
              <p className="max-w-xl text-[0.75rem] text-muted-foreground">
                Write copy and drop imagery or reels into the same workspace.
              </p>
            </div>
          </div>

          {!text && assets.length === 0 ? (
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/15 px-4 py-4 text-muted-foreground">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/80 backdrop-blur">
                <FileImageIcon aria-hidden className="size-4" />
              </span>
              <p className="text-[0.75rem] leading-relaxed">
                Drag imagery or reels into this card, paste files from the clipboard, or attach with the button below.
              </p>
            </div>
          ) : null}

          <label
            htmlFor={textareaDomId}
            className={cn(
              "group relative cursor-text rounded-xl border border-transparent transition-colors hover:border-border focus-within:border-input focus-within:bg-muted/[0.06]",
            )}
          >
            <span className="sr-only">
              Composition — text and unified media drop zone
            </span>
            <Textarea
              id={textareaDomId}
              value={text}
              placeholder="Paste a hook, captions, hashtags — then drop uploads anywhere in this panel…"
              onChange={(ev) => setText(ev.target.value)}
              onPaste={(ev) =>
                addFiles(Array.from(ev.clipboardData.files))
              }
              aria-label="Shot text"
              className={cn(
                "min-h-36 resize-none rounded-xl border-transparent bg-muted/[0.04] shadow-none hover:bg-muted/[0.06]",
                isDragging &&
                  "bg-brand-accent/[0.04] hover:bg-brand-accent/[0.05]",
              )}
            />
          </label>

          {assets.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Asset tray · {assets.length}{" "}
                  {assets.length === 1 ? "file" : "files"}
                </p>
              </div>
              <LayoutGroup id={composerId}>
                <motion.div layout className="relative">
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                    <AnimatePresence initial={false} mode="popLayout">
                      {assets.map((asset) => (
                        <motion.div
                          key={asset.id}
                          layout="position"
                          initial={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scale: 0.85, filter: "blur(2px)" }}
                          transition={{
                            type: "spring",
                            stiffness: 520,
                            damping: 36,
                          }}
                          className="relative shrink-0"
                        >
                          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/35 p-1.5 backdrop-blur-sm">
                            <div className="relative h-[4.75rem] w-[5.75rem] overflow-hidden rounded-[0.5rem] bg-background">
                              {asset.kind === "image" ? (
                                <img
                                  src={asset.previewUrl}
                                  alt={asset.file.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <>
                                  <video
                                    src={asset.previewUrl}
                                    className="size-full object-cover opacity-95"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                  <CirclePlay className="absolute bottom-2 left-2 size-4 text-white drop-shadow" />
                                </>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-xs"
                                nativeButton={true}
                                className="absolute right-1 top-1 h-7 w-7 rounded-md border-none bg-black/65 text-background hover:bg-black/85"
                                onClick={() => removeAsset(asset.id)}
                                aria-label={`Remove ${asset.file.name}`}
                              >
                                <Trash2 aria-hidden />
                              </Button>
                            </div>
                            <p className="line-clamp-2 w-[5.75rem] break-all text-center text-[0.65rem] text-muted-foreground">
                              {asset.file.name}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </LayoutGroup>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept={ACCEPT_MEDIA}
                multiple
                tabIndex={-1}
                className="peer sr-only"
                id={`${composerId}-picker`}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files?.length) {
                    addFiles(Array.from(e.target.files));
                  }
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                className="border-dashed hover:border-muted-foreground/40"
                onClick={() =>
                  document.getElementById(`${composerId}-picker`)?.click()
                }
              >
                <ImagePlus aria-hidden />
                Attach media
              </Button>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              {submitError ? (
                <p className="text-right text-[0.75rem] text-destructive sm:mr-auto">
                  {submitError}
                </p>
              ) : null}
              <Button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isSubmitting}
                nativeButton={true}
              >
                {isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : (
                  <Sparkles aria-hidden />
                )}
                {isSubmitting ? "Publishing…" : "Generate"}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
