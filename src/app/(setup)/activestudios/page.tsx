"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { clearLastActiveStudio } from "@/actions/studio";
import { useAtomValue } from "jotai";
import { activeStudioAtom } from "@/atom/studioAtoms";
import Link from "next/link";

type StudioDoc = {
  _id: Id<"studios">;
  name: string;
  slug: string;
  ownerId: string;
};

export default function ActiveStudiosPage() {
  const router = useRouter();
  const { user } = useUser();
  const { selectStudio } = useStudioNavigation();
  const studios = useQuery(api.studios.getMyStudios) as
    | StudioDoc[]
    | undefined;
  const updateStudio = useMutation(
    api.studios.updateStudio,
  );
  const deleteStudio = useMutation(
    api.studios.deleteStudio,
  );
  const acceptJoinRequest = useMutation(
    api.studios.acceptJoinRequest,
  );
  const rejectJoinRequest = useMutation(
    api.studios.rejectJoinRequest,
  );
  const lastActiveStudio = useAtomValue(activeStudioAtom);

  const [editingStudio, setEditingStudio] = useState<{
    _id: Id<"studios">;
    name: string;
    slug: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    _id: Id<"studios">;
    name: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [managingStudioId, setManagingStudioId] =
    useState<Id<"studios"> | null>(null);
  //   const joinRequests = useQuery(
  //     api.studios.getJoinRequests,
  //     {
  //       studioId: managingStudioId!,
  //     },
  //   ) as
  //     | {
  //         _id: Id<"join_requests">;
  //         studioId: Id<"studios">;
  //         userId: string;
  //         displayName?: string;
  //         status: string;
  //         createdAt: number;
  //       }[]
  //     | undefined;

  if (studios === undefined) {
    return (
      <div className="relative min-h-dvh overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(250,10,97,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,10,97,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,1)_100%)]"
        />
        <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-12 sm:px-8">
          <div className="flex items-center gap-4 rounded-full border border-border bg-card/90 px-6 py-4 text-base text-muted-foreground shadow-soft backdrop-blur-md">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
            Loading your active studios...
          </div>
        </div>
      </div>
    );
  }

  const handleCopyLink = async (slug: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/${slug}/dashboard`,
    );
    toast.success("Studio link copied.");
  };

  const handleSaveStudio = async () => {
    if (!editingStudio) return;
    if (
      !editingStudio.name.trim() ||
      !editingStudio.slug.trim()
    ) {
      toast.error("Name and link are required.");
      return;
    }

    setSaving(true);
    try {
      await updateStudio({
        studioId: editingStudio._id,
        name: editingStudio.name,
        slug: editingStudio.slug,
      });

      toast.success("Studio updated.");
      setEditingStudio(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update studio.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudio = async () => {
    if (!deleteTarget) return;

    setRemoving(true);
    try {
      if (
        lastActiveStudio &&
        lastActiveStudio.studioId === deleteTarget._id
      ) {
        // 2. Clear the Clerk metadata SECOND
        await clearLastActiveStudio();
      }
      await deleteStudio({ studioId: deleteTarget._id });
      toast.success("Studio deleted.");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete studio.",
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(250,10,97,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,10,97,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,1)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-35"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-brand/15 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-foreground/75">
                Active studios
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                All studios connected to you
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Review the studios you belong to, jump into
                a dashboard, or manage a workspace from the
                card menu.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-background/80 px-5 shadow-feather"
                onClick={() => router.push("/joinstudio")}>
                Create or join studio
              </Button>
              <Button
                className="h-11 rounded-full bg-brand px-5 font-semibold text-white shadow-glow hover:bg-brand-600"
                onClick={() =>
                  studios.length > 0 &&
                  selectStudio(
                    studios[0]._id,
                    studios[0].slug,
                  )
                }
                disabled={!studios.length}>
                Open latest studio
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">
                Connected studios
              </div>
              <div className="mt-2 text-3xl font-semibold text-foreground">
                {studios.length}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">
                Signed in as
              </div>
              <div className="mt-2 truncate text-lg font-semibold text-foreground">
                {user?.fullName ||
                  user?.primaryEmailAddress?.emailAddress ||
                  "Studio member"}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">
                Quick action
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                Use the top-right menu on any card
              </div>
            </div>
          </div>
        </div>

        {studios.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-border/70 bg-card/80 p-10 text-center shadow-soft backdrop-blur-sm">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              No studios yet
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Create a new studio or join an existing one to
              see it appear here.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/joinstudio")}>
                Create or join
              </Button>
              <Button
                onClick={() => router.push("/joinstudio")}>
                Get started
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {studios.map((studio) => {
              const isOwner = studio.ownerId === user?.id;

              return (
                <div
                  key={studio._id}
                  className="group relative overflow-hidden rounded-3xl border border-black/5 bg-card p-7 text-left shadow-feather transition-all duration-300 hover:border-foreground/20 hover:shadow-soft hover:-translate-y-1 hover:scale-[1.01]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted">
                      <Building2 className="h-5 w-5 text-foreground/80" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-brand/20 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand">
                        <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-[1px] rounded-full bg-brand" />
                        {isOwner ? "Owner" : "Member"}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0 text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
                              aria-label="Studio actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent
                          align="center"
                          side="inline-end"
                          className="w-56">
                          <DropdownMenuItem
                            onClick={() =>
                              selectStudio(
                                studio._id,
                                studio.slug,
                                true, // Open in a new tab does use the useRouter function
                              )
                            }
                            render={
                              <Link
                                href={`/${studio.slug}/dashboard`}
                                target="_blank"
                              />
                            }>
                            <ExternalLink className="h-4 w-4" />
                            Open dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleCopyLink(studio.slug)
                            }>
                            <Copy className="h-4 w-4" />
                            Copy dashboard link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleCopyLink(studio.slug)
                            }>
                            <Copy className="h-4 w-4" />
                            Copy viewer invite code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingStudio({
                                _id: studio._id,
                                name: studio.name,
                                slug: studio.slug,
                              })
                            }
                            disabled={!isOwner}>
                            <PenLine className="h-4 w-4" />
                            Edit studio
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                _id: studio._id,
                                name: studio.name,
                              })
                            }
                            disabled={!isOwner}>
                            <Trash2 className="h-4 w-4" />
                            Delete studio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-1 min-w-0 flex-col">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors truncate">
                      {studio.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground truncate">
                      /{studio.slug}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-4">
                    <div className="flex -space-x-2">
                      <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-card bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.pravatar.cc/60?img=11`}
                          alt="Team member"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-8"
                      onClick={() =>
                        selectStudio(
                          studio._id,
                          studio.slug,
                        )
                      }>
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!editingStudio}
        onOpenChange={(open) =>
          !open && setEditingStudio(null)
        }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit studio</DialogTitle>
            <DialogDescription>
              Update the studio name and public link slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Studio name
              </label>
              <Input
                value={editingStudio?.name || ""}
                onChange={(e) =>
                  setEditingStudio((current) =>
                    current
                      ? { ...current, name: e.target.value }
                      : current,
                  )
                }
                className="h-11 border-border bg-background/80 shadow-feather"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Studio slug
              </label>
              <div className="flex items-center gap-0">
                <span className="flex h-11 items-center rounded-l-md border border-border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                  lume.com/
                </span>
                <Input
                  value={editingStudio?.slug || ""}
                  onChange={(e) =>
                    setEditingStudio((current) =>
                      current
                        ? {
                            ...current,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(
                                /[^a-z0-9\-_]+/g,
                                "",
                              ),
                          }
                        : current,
                    )
                  }
                  className="h-11 rounded-l-none border-border bg-background/80 shadow-feather"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStudio(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveStudio}
              disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!managingStudioId}
        onOpenChange={(open) =>
          !open && setManagingStudioId(null)
        }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pending join requests</DialogTitle>
            <DialogDescription>
              Review and accept or reject pending requests
              for this studio. Assign a role when accepting.
            </DialogDescription>
          </DialogHeader>

          {/* <div className="space-y-4 mt-4">
            {joinRequests && joinRequests.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No pending requests.
              </div>
            )}

            {joinRequests?.map((req) => (
              <div
                key={String(req._id)}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    {req.displayName || req.userId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requested{" "}
                    {new Date(
                      req.createdAt,
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={"viewer"}
                    onChange={(e) => {
                      // store role choice on the element via dataset (no need for global state)
                      (
                        e.target as HTMLSelectElement
                      ).dataset.role = e.target.value;
                    }}
                    className="rounded-md border border-border/60 bg-background/80 px-2 py-1 text-sm">
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async (e) => {
                      const selectEl = e.currentTarget
                        .previousSibling as HTMLSelectElement;
                      const role =
                        selectEl?.value || "viewer";
                      try {
                        await acceptJoinRequest({
                          requestId: req._id,
                          role: "viewer",
                        });
                        toast.success("Request accepted.");
                        router.refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to accept request.",
                        );
                      }
                    }}>
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await rejectJoinRequest({
                          requestId: req._id,
                        });
                        toast.success("Request rejected.");
                        router.refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to reject request.",
                        );
                      }
                    }}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div> */}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManagingStudioId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmation("");
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete studio
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              and all of its members, linked accounts, and
              shots. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                To confirm, type the studio name below:
              </label>
              <Input
                placeholder={deleteTarget?.name || ""}
                value={deleteConfirmation}
                onChange={(e) =>
                  setDeleteConfirmation(e.target.value)
                }
                className="h-11 border-border bg-background/80 shadow-feather"
                autoFocus
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteStudio}
              disabled={
                removing ||
                deleteConfirmation !== deleteTarget?.name
              }>
              {removing ? "Deleting..." : "Delete studio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
