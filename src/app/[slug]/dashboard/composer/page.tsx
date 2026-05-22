"use client";

import { useMutation, useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import { File, Image as ImageIcon, Loader2, Mic, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

import { activeStudioAtom } from "@/atom/studioAtoms";
import { PLATFORMS } from "@/lib/constants";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type UploadedMediaKind = "image" | "video" | "audio" | "file";

export default function ComposerPage() {
  const router = useRouter();
  const activeStudio = useAtomValue(activeStudioAtom);
  const studioId = activeStudio?.studioId;
  const slug = activeStudio?.slug;

  const createShot = useMutation(api.shots.createShot);
  const currentUser = useQuery(api.auth.getCurrentUser, {});
  const studio = useQuery(
    api.studios.getStudioById,
    studioId ? { studioId: studioId as Id<"studios"> } : "skip",
  );

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState("");
  const [videos, setVideos] = useState("");
  const [audios, setAudios] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedFileKind, setUploadedFileKind] = useState<UploadedMediaKind | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setFilePreviewUrl("");
      return;
    }

    const preview = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(preview);

    return () => URL.revokeObjectURL(preview);
  }, [selectedFile]);

  const previewSource = uploadedFileUrl || filePreviewUrl;
  const previewKind = useMemo(() => {
    if (!selectedFile) return null;
    if (selectedFile.type.startsWith("image/")) return "image";
    if (selectedFile.type.startsWith("video/")) return "video";
    if (selectedFile.type.startsWith("audio/")) return "audio";
    return "file";
  }, [selectedFile]);

  const studioName = studio?.name ?? "Active studio";
  const studioMemberId = studio?._id ?? studioId;
  const userName = currentUser?.name ?? currentUser?.email ?? "Current user";
  const userId = currentUser?.clerkId ?? "unknown";

  const handleCreate = async () => {
    if (!studioId) return toast.error("Select an active studio first.");
    if (!text.trim()) return toast.error("Shot copy is required.");
    if (uploadingFile) return toast.error("Wait for the file upload to finish.");
    if (selectedFile && !uploadedFileUrl) {
      return toast.error("Upload the selected file before creating the shot.");
    }

    const inputs: {
      text: string;
      images?: string[];
      videos?: string[];
      audios?: string[];
    } = { text: text.trim() };

    const parseList = (val: string) =>
      val
        .split(/\r?\n|,/) // allow newline or comma separated
        .map((s) => s.trim())
        .filter(Boolean);

    const imgs = parseList(images);
    const vids = parseList(videos);
    const auds = parseList(audios);

    if (imgs.length) inputs.images = imgs;
    if (vids.length) inputs.videos = vids;
    if (auds.length) inputs.audios = auds;
    if (uploadedFileUrl) {
      if (uploadedFileKind === "video") {
        inputs.videos = [...(inputs.videos ?? []), uploadedFileUrl];
      } else if (uploadedFileKind === "audio") {
        inputs.audios = [...(inputs.audios ?? []), uploadedFileUrl];
      } else {
        inputs.images = [...(inputs.images ?? []), uploadedFileUrl];
      }
    }

    setLoading(true);
    try {
      const newId = await createShot({
        title: title.trim() || undefined,
        inputs,
        // platforms omitted so server will fill defaults
        studioId: studioId as Id<"studios">,
      });

      toast.success("Shot created!");
      if (slug && newId) {
        router.push(`/${slug}/dashboard/shots/${newId}`);
      } else if (slug) {
        router.push(`/${slug}/dashboard/shots`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create shot.");
      setLoading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadedFileUrl("");
    setUploadedFileKind(null);

    if (!file || !studioId) {
      return;
    }

    const kind: UploadedMediaKind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("image/")
          ? "image"
          : "file";

    setUploadedFileKind(kind);
    setUploadingFile(true);

    try {
      const response = await fetch("/api/uploads/r2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          studioId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "Failed to prepare upload.");
      }

      const payload = (await response.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const uploadResponse = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to R2.");
      }

      setUploadedFileUrl(payload.publicUrl);
      toast.success("File uploaded to Cloudflare R2.");
    } catch (error) {
      setSelectedFile(null);
      setUploadedFileKind(null);
      setUploadedFileUrl("");
      toast.error(
        error instanceof Error ? error.message : "File upload failed.",
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl("");
    setUploadedFileUrl("");
    setUploadedFileKind(null);
  };

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Composer
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              New shot composer
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Draft the copy, upload a file to Cloudflare R2,
              and create a shot in the current studio.
            </p>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/${slug ?? "activestudios"}/dashboard/shots`}>Back to shots</Link>}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Shot composer</CardTitle>
              <CardDescription>
                Create a shot with copy, media URLs, and an uploaded file preview.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                {/* <MetadataPill label="Studio" value={studioName} idValue={String(studioMemberId ?? "unknown")} />
                <MetadataPill label="User" value={userName} idValue={userId} /> */}
              </div>

              <div>
                <label className="ml-1 text-sm font-medium text-foreground/80">Title (optional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short descriptive title"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="ml-1 text-sm font-medium text-foreground/80">Copy</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the shot copy — this is required"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="ml-1 text-sm font-medium text-foreground/80">File upload</label>
                <div className="mt-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                  <Input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="h-auto border-0 bg-transparent px-0 py-2 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      Selected files are uploaded to Cloudflare R2 before the shot is created.
                    </span>
                    {(selectedFile || uploadingFile) ? (
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {selectedFile ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <File className="h-4 w-4" />
                          {selectedFile.name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedFile.type || "application/octet-stream"} · {formatBytes(selectedFile.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {uploadingFile ? "Uploading to R2..." : uploadedFileUrl ? "Uploaded to R2" : "Ready"}
                        </p>
                        {uploadedFileUrl ? (
                          <a
                            href={uploadedFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-xs font-medium text-primary hover:underline"
                          >
                            Open R2 asset
                          </a>
                        ) : null}
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80">
                        {previewSource ? (
                          previewKind === "image" ? (
                            <img
                              src={previewSource}
                              alt={selectedFile.name}
                              className="h-48 w-full object-cover"
                            />
                          ) : previewKind === "video" ? (
                            <video
                              controls
                              className="h-48 w-full bg-black object-cover"
                              src={previewSource}
                            />
                          ) : previewKind === "audio" ? (
                            <div className="flex h-48 items-center justify-center p-4">
                              <audio controls className="w-full" src={previewSource} />
                            </div>
                          ) : (
                            <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                              <a className="font-medium text-primary hover:underline" href={previewSource} target="_blank" rel="noreferrer">
                                Open uploaded file
                              </a>
                            </div>
                          )
                        ) : (
                          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                            Preview will appear here.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="ml-1 text-sm font-medium text-foreground/80">Images (URLs)</label>
                  <Textarea
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    placeholder="One URL per line or comma-separated"
                    className="mt-2 h-24"
                  />
                </div>

                <div>
                  <label className="ml-1 text-sm font-medium text-foreground/80">Videos (URLs)</label>
                  <Textarea
                    value={videos}
                    onChange={(e) => setVideos(e.target.value)}
                    placeholder="One URL per line or comma-separated"
                    className="mt-2 h-24"
                  />
                </div>

                <div>
                  <label className="ml-1 text-sm font-medium text-foreground/80">Audio (URLs)</label>
                  <Textarea
                    value={audios}
                    onChange={(e) => setAudios(e.target.value)}
                    placeholder="One URL per line or comma-separated"
                    className="mt-2 h-24"
                  />
                </div>
              </div>

              <div>
                <label className="ml-1 text-sm font-medium text-foreground/80">Publish Targets</label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected targets will be published later — platform entries are created automatically.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <span key={p.key} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm">
                      <span className="font-medium">{p.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button nativeButton={false} render={<Link href={`/${slug ?? "activestudios"}/dashboard/shots`}>Cancel</Link>} />
                <Button onClick={handleCreate} disabled={loading || uploadingFile} className="bg-brand text-white">
                  {loading ? "Creating..." : "Create Shot"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Composer details</CardTitle>
                <CardDescription>
                  Studio and user context for this composer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Studio name" value={studioName} />
                <DetailRow label="Studio ID" value={String(studioMemberId ?? "unknown")} />
                <DetailRow label="User name" value={userName} />
                <DetailRow label="User ID" value={userId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File preview rules</CardTitle>
                <CardDescription>
                  Uploaded media is pushed to R2, then used in the shot payload.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <PreviewRule icon={ImageIcon} label="Images" text="Image files render inline and are added to the images array." />
                <PreviewRule icon={Video} label="Videos" text="Video files render with controls and are added to the videos array." />
                <PreviewRule icon={Mic} label="Audio" text="Audio files render with controls and are added to the audios array." />
                <PreviewRule icon={Loader2} label="Upload state" text="The shot cannot be created until the selected file finishes uploading." />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataPill({
  label,
  value,
  idValue,
}: {
  label: string;
  value: string;
  idValue: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">ID: {idValue}</p>
    </div>
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
      <span className="text-right font-medium text-foreground">{value}</span>
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
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
