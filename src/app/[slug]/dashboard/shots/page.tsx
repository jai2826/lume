"use client";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
    ArrowRight,
    FileText,
    Image as ImageIcon,
    Mic,
    Plus,
    PlusIcon,
    Video,
} from "lucide-react";
import Link from "next/link";

import DashboardHeader from "@/app/[slug]/_components/DashboardHeader";
import { PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function ShotsPage() {
  const activeStudio = useAtomValue(activeStudioAtom);
  const studioId = activeStudio?.studioId;
  const slug = activeStudio?.slug;

  const shots = useQuery(
    api.shots.listStudioShots,
    studioId
      ? { studioId: studioId as Id<"studios"> }
      : "skip",
  );

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <DashboardHeader
          tag="Shots"
          heading="Shot library"
          description="Review every shot in this studio, open any shot by its URL, and jump into a new shot from the top-right action."
          CustomButtons={[
            <Button
              key="create-shot"
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={`/${slug}/dashboard/composer/`}>
                  <PlusIcon />
                 Create Shot
                </Link>
              }
            />,
          ]}
        />

        {!studioId ? (
          <Card>
            <CardHeader>
              <CardTitle>Select a studio</CardTitle>
              <CardDescription>
                Choose an active studio before browsing its
                shots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link href="/activestudios">
                    Go to active studios
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : shots === undefined ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-border/70 bg-card"
              />
            ))}
          </div>
        ) : shots.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No shots yet</CardTitle>
              <CardDescription>
                Create the first shot for this studio and it
                will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/${slug}/dashboard/composer`}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                    your first shot
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {shots.map((shot) => {
              const imageCount =
                shot.inputs.images?.length ?? 0;
              const videoCount =
                shot.inputs.videos?.length ?? 0;
              const audioCount =
                shot.inputs.audios?.length ?? 0;
              const platformCount = PLATFORMS.filter(
                (platform) =>
                  shot.platforms[platform.key].status ===
                  "published",
              ).length;

              return (
                <Link
                  key={shot._id}
                  href={`/${slug}/dashboard/shots/${shot._id}`}
                  className="group rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Shot ID {shot._id.slice(-6)}
                      </p>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {shot.title || "Untitled shot"}
                      </h2>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        {shot.inputs.text.slice(0, 160)}
                        {shot.inputs.text.length > 160
                          ? "..."
                          : ""}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:bg-muted">
                      Open{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                    <ShotMetaPill
                      icon={FileText}
                      label="Text"
                      value="Included"
                    />
                    <ShotMetaPill
                      icon={ImageIcon}
                      label="Images"
                      value={`${imageCount}`}
                    />
                    <ShotMetaPill
                      icon={Video}
                      label="Videos"
                      value={`${videoCount}`}
                    />
                    <ShotMetaPill
                      icon={Mic}
                      label="Audio"
                      value={`${audioCount}`}
                    />
                    <ShotMetaPill
                      label="Published apps"
                      value={`${platformCount}`}
                    />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {PLATFORMS.map((platform) => {
                      const entry =
                        shot.platforms[platform.key];

                      return (
                        <div
                          key={platform.key}
                          className="rounded-xl border border-border/60 bg-background/70 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {platform.label}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                statusStyles[entry.status],
                              )}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {entry.generatedText ||
                              "No generated copy yet."}
                          </p>

                          {entry.aiPrompt ? (
                            <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">
                              AI prompt: {entry.aiPrompt}
                            </p>
                          ) : null}

                          {entry.generatedImageUrl ? (
                            <a
                              href={entry.generatedImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
                              Open generated image
                            </a>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ShotMetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs">
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="text-muted-foreground">
        {label}:
      </span>
      <span className="text-foreground">{value}</span>
    </span>
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
