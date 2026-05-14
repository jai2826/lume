"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";
import { generateFriendlySlug } from "@/lib/slug-generator";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RiResetLeftLine } from "react-icons/ri";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "join">(
    "create",
  );
  const { selectStudio } = useStudioNavigation();

  // Form State
  const [studioName, setStudioName] = useState("");
  const [slug, setSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const studios = useQuery(api.studios.getMyStudios);
  const createStudio = useMutation(api.studios.create);
  const joinStudio = useMutation(api.studios.join); // now creates a join request

  if (studios === undefined) {
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
        <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-12 sm:px-8">
          <div className="flex items-center gap-4 rounded-full border border-border bg-card/90 px-6 py-4 text-base text-muted-foreground shadow-soft backdrop-blur-md">
            <span className="h-3 w-3 animate-pulse rounded-full bg-brand" />
            Loading your studios...
          </div>
        </div>
      </div>
    );
  }

  const handleCreateStudio = async () => {
    if (!studioName.trim() || !slug.trim())
      return toast.error("Name and Link are required.");
    setLoading(true);
    try {
      const newStudio = await createStudio({
        name: studioName,
        slug,
      });
      toast.success("Studio created!");
      await selectStudio(
        newStudio.studioId,
        newStudio.slug,
      );
      
      router.push(`/${newStudio.slug}/onboarding`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create studio.",
      );
      setLoading(false);
    }
  };

  const handleJoinStudio = async () => {
    if (!inviteCode.trim())
      return toast.error("Please enter an invite code.");
    if (inviteCode.length !== 10)
      return toast.error(
        "Code must be exactly 10 characters.",
      );

    setLoading(true);
    try {
      await joinStudio({ inviteCode: inviteCode.toUpperCase() });
      toast.success("Join request sent — wait for owner approval.");
      setInviteCode("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to join studio.",
      );
      setLoading(false);
    }
  };

  const handleOpenActiveStudios = () => {
    router.push("/activestudios");
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

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/90 shadow-soft backdrop-blur-md">
          <div className="border-b border-border/70 px-8 py-8 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-brand/15 bg-brand/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-foreground/75">
                  Workspace setup
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Create or join a studio
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Set up a new workspace for your brand or enter
                  an invite code to join an existing team.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-11 rounded-full border-border/70 bg-background/80 px-5 shadow-feather"
                onClick={handleOpenActiveStudios}
              >
                View active studios
              </Button>
            </div>
          </div>

          <div className="px-8 py-8 sm:px-10 sm:py-10">
            <div className="mb-10 flex gap-6 border-b border-border/70 pb-3">
              <button
                onClick={() => setMode("create")}
                className={`pb-3 text-lg font-semibold transition-colors sm:text-xl ${mode === "create" ? "border-b-2 border-brand text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Create Studio
              </button>
              <button
                onClick={() => setMode("join")}
                className={`pb-3 text-lg font-semibold transition-colors sm:text-xl ${mode === "join" ? "border-b-2 border-brand text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Join Studio
              </button>
            </div>

            {mode === "create" ? (
              <div className="mb-6 space-y-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Create a new command center for your
                  brand.
                </p>
                <div>
                  <label className="ml-1 text-sm font-medium text-foreground/80">
                    Studio Name
                  </label>
                  <Input
                    placeholder="e.g., Purejoy Studio"
                    value={studioName}
                    onChange={(e) => {
                      setStudioName(e.target.value);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-") // Step 1: Replace one or more spaces with a single hyphen
                          .replace(/[^a-z0-9\-]+/g, ""), // Step 2: Strip out anything that isn't a-z, 0-9, -, or _
                      );
                    }}
                    className="mt-1 h-11 border-border bg-background/80 text-foreground shadow-feather focus-visible:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="flex items-center justify-between w-full ml-1 text-sm font-medium text-foreground/80">
                    Your Studio Link
                    <Button
                      className={"mr-1"}
                      variant={"outline"}
                      size={"icon-sm"}
                      onClick={() => {
                        setSlug(generateFriendlySlug());
                      }}>
                      <RiResetLeftLine className=" inline text-muted-foreground" />
                    </Button>
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="flex h-11 items-center rounded-l-md border border-border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      lume.com/
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\-_]+/g, ""), // Step 2: Strip out anything that isn't a-z, 0-9, -, or _
                        );
                      }}
                      className="h-11 rounded-l-none border-border bg-background/80 text-foreground shadow-feather focus-visible:ring-brand/30"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateStudio}
                  disabled={loading}
                  className="mt-4 h-11 w-full rounded-full bg-brand font-semibold text-white shadow-glow transition-all hover:bg-brand-600">
                  {loading
                    ? "Forging..."
                    : "Initialize Studio"}
                </Button>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Enter the 10-character invite code
                  provided by your Admin.
                </p>
                <div>
                  <label className="ml-1 text-sm font-medium text-foreground/80">
                    Invite Code
                  </label>
                  <Input
                    placeholder="e.g., a1b2c3d4e5"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(
                        e.target.value.toLowerCase(),
                      )
                    }
                    className="mt-1 h-11 border-border bg-background/80 text-center text-lg tracking-[0.28em] text-foreground shadow-feather focus-visible:ring-brand/30"
                    maxLength={10}
                  />
                </div>
                <Button
                  onClick={handleJoinStudio}
                  disabled={loading}
                  className="mt-4 h-11 w-full rounded-full bg-foreground font-semibold text-background shadow-soft transition-all hover:bg-foreground/90">
                  {loading ? "Joining..." : "Join Studio"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
