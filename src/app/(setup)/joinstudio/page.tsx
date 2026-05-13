"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateFriendlySlug } from "@/lib/slug-generator";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RiResetLeftLine } from "react-icons/ri";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "join">(
    "create",
  );

  // Form State
  const [studioName, setStudioName] = useState("");
  const [slug, setSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const studios = useQuery(api.studios.getMyStudios);
  const createStudio = useMutation(api.studios.create);
  const joinStudio = useMutation(api.studios.join);

  // useEffect(() => {
  //   if (userEditedSlug) return;
  //   if (!studioName || studioName.trim().length === 0) {
  //     setSlug("");
  //     return;
  //   }

  //   const t = setTimeout(() => {
  //     setSlug(generateFriendlySlug());
  //   }, 2000);

  //   return () => clearTimeout(t);
  // }, [studioName]);

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
        <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card/90 px-5 py-3 text-sm text-muted-foreground shadow-soft backdrop-blur-md">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
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
      await createStudio({ name: studioName, slug });
      toast.success("Studio created!");
      // Send Admins to the Social Linking page
      router.push("/onboarding");
    } catch (e: any) {
      toast.error(e.message || "Failed to create studio.");
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
      await joinStudio({
        inviteCode: inviteCode.toLowerCase(),
      });
      toast.success("Successfully joined studio!");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to join studio.");
      setLoading(false);
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

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-soft backdrop-blur-md">
          <div className="border-b border-border/70 px-6 py-6 sm:px-8">
            <div className="inline-flex rounded-full border border-brand/15 bg-brand/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/75">
              Workspace setup
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Create or join a studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[1rem]">
              Set up a new workspace for your brand or enter
              an invite code to join an existing team.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-8 flex gap-4 border-b border-border/70 pb-2">
              <button
                onClick={() => setMode("create")}
                className={`pb-2 text-base font-semibold transition-colors sm:text-lg ${mode === "create" ? "border-b-2 border-brand text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Create Studio
              </button>
              <button
                onClick={() => setMode("join")}
                className={`pb-2 text-base font-semibold transition-colors sm:text-lg ${mode === "join" ? "border-b-2 border-brand text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
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
