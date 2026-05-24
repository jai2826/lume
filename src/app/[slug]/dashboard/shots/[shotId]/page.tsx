"use client";

import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
  ArrowLeft,
  Image as ImageIcon,
  Link2,
  Mic,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { LinkedStatus } from "@/app/[slug]/_components/LinkedStatus";
import { activeStudioAtom } from "@/atom/studioAtoms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCachedStudioLinkedAccounts } from "@/hooks/useStudioCache";
import { PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function ShotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activeStudio = useAtomValue(activeStudioAtom);
  const studioId = activeStudio?.studioId;
  const slug = params.slug as string;
  const shotId = params.shotId as string;

  const shot = useQuery(
    api.shots.getShotById,
    shotId ? { shotId: shotId as Id<"shots"> } : "skip",
  );
  const { accounts: linkedAccounts } =
    useCachedStudioLinkedAccounts(studioId);

  if (!studioId) {
    return (
      <div className="p-8 md:p-12">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Select a studio</CardTitle>
            <CardDescription>
              Choose an active studio before opening a shot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="outline"
              render={
                <Link href="/activestudios">
                  Go to active studios
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shot === undefined) {
    return (
      <div className="p-8 md:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-muted/60" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card" />
            <div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (!shot) {
    return (
      <div className="p-8 md:p-12">
        <Card className="mx-auto max-w-3xl border-dashed">
          <CardHeader>
            <CardTitle>Shot not found</CardTitle>
            <CardDescription>
              This shot may have been deleted or you may not
              have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              nativeButton={false}
              render={
                <Link href={`/${slug}/dashboard/shots`}>
                  Back to shots
                </Link>
              }
            />
            <Button
              variant="outline"
              onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imageCount = shot.inputs.images?.length ?? 0;
  const videoCount = shot.inputs.videos?.length ?? 0;
  const audioCount = shot.inputs.audios?.length ?? 0;

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Shot {shot._id.slice(-8)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {shot.title || "Untitled shot"}
              </h1>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
                Open this shot by its ID URL, inspect the
                content payload, and review where it has
                already been published.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link href={`/${slug}/dashboard/shots`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />{" "}
                  Back to shots
                </Link>
              }
            />
            <Button
              className="bg-brand text-white hover:bg-brand/90"
              nativeButton={false}
              render={
                <Link href={`/${slug}/dashboard/composer`}>
                  Add new shot
                </Link>
              }
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Shot details</CardTitle>
              <CardDescription>
                Core metadata for this shot and its current
                publication state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                label="Shot ID"
                value={shot._id}
              />
              <DetailRow
                label="Studio ID"
                value={shot.studioId}
              />
              <DetailRow
                label="Created by"
                value={shot.createdBy}
              />
              <DetailRow
                label="Created"
                value={new Date(
                  shot._creationTime,
                ).toLocaleString()}
              />
              <DetailRow
                label="Platforms"
                value={`${PLATFORMS.filter((platform) => shot.platforms[platform.key].status === "published").length} published`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shot data</CardTitle>
              <CardDescription>
                The payload attached to this shot, including
                text, media, and attached assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Link2 className="h-4 w-4" /> Text
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {shot.inputs.text}
                </p>
              </div>

              <MediaSection
                label="Images"
                count={imageCount}
                icon={ImageIcon}
                items={shot.inputs.images ?? []}
                renderItem={(src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt={`Shot image ${index + 1}`}
                    className="h-36 w-full rounded-xl object-cover"
                  />
                )}
              />

              <MediaSection
                label="Videos"
                count={videoCount}
                icon={Video}
                items={shot.inputs.videos ?? []}
                renderItem={(src, index) => (
                  <video
                    key={`${src}-${index}`}
                    controls
                    className="h-40 w-full rounded-xl bg-black object-cover"
                    src={src}
                  />
                )}
              />

              <MediaSection
                label="Audio"
                count={audioCount}
                icon={Mic}
                items={shot.inputs.audios ?? []}
                renderItem={(src, index) => (
                  <audio
                    key={`${src}-${index}`}
                    controls
                    className="w-full"
                    src={src}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded apps</CardTitle>
              <CardDescription>
                These are the apps this shot is published or
                prepared for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {PLATFORMS.map((platform) => {
                  const entry =
                    shot.platforms[platform.key];
                  return (
                    <div
                      key={platform.key}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-foreground">
                          {platform.label}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            statusStyles[entry.status],
                          )}>
                          {entry.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                        <span className="rounded-full border border-border/60 px-2.5 py-1">
                          {entry.selected
                            ? "Target selected"
                            : "Target off"}
                        </span>
                        {entry.postType ? (
                          <span className="rounded-full border border-border/60 px-2.5 py-1">
                            {entry.postType}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">
                        {entry.generatedText ||
                          "No generated copy yet."}
                      </p>

                      {entry.notes ? (
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          Notes: {entry.notes}
                        </p>
                      ) : null}

                      {entry.mediaAssetUrl ? (
                        <a
                          href={entry.mediaAssetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                          Open attached media
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <LinkedStatus
            accounts={linkedAccounts}
            title="Upload to new apps"
            description="Connect more social accounts, then use those destinations for this shot."
            onConnectPlatform={() => {
              router.push(`/${slug}/onboarding`);
            }}
          />
        </div>
      </div>
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
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function MediaSection<T extends string>({
  label,
  count,
  icon: Icon,
  items,
  renderItem,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <span className="text-xs text-muted-foreground">
          {count} item(s)
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map(renderItem)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
          No {label.toLowerCase()} attached yet.
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  generating:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ready: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  published:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
