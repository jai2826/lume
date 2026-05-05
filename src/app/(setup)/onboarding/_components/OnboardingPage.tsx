"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PlatformCard } from "./PlatformCard";
import { api } from "../../../../../convex/_generated/api";

export function OnboardingPage({ clerkUserId }: { clerkUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // UI State for Step 1
  const [mode, setMode] = useState<"create" | "join">("create");
  const [studioName, setStudioName] = useState("");
  const [slug, setSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const studios = useQuery(api.studios.getMyStudios);
  const currentStudio = studios?.[0]; 

  const linkedAccounts = useQuery(
    api.auth.getStudioLinkedAccounts, 
    currentStudio?.role === "admin" ? { studioId: currentStudio._id } : "skip" // Only fetch if Admin
  );

  const createStudio = useMutation(api.studios.create);
  const joinStudio = useMutation(api.studios.join);

  const handleCreateStudio = async () => {
    if (!studioName.trim() || !slug.trim()) return toast.error("Name and Link are required.");
    setLoading(true);
    try {
      await createStudio({ name: studioName, slug });
      toast.success("Studio created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create studio.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinStudio = async () => {
    if (!inviteCode.trim()) return toast.error("Please enter an invite code.");
    setLoading(true);
    try {
      await joinStudio({ inviteCode });
      toast.success("Successfully joined studio!");
    } catch (e: any) {
      toast.error(e.message || "Failed to join studio.");
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
       
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to finish onboarding.");
      setLoading(false);
    }
  };

  if (studios === undefined) return <div className="min-h-screen bg-bg flex items-center justify-center">Loading...</div>;

  // ==========================================
  // STEP 1: CREATE OR JOIN A STUDIO
  // ==========================================
  if (studios.length === 0) {
    return (
      <div className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full glass-panel p-8 rounded-xl border border-white/10 text-left">
          
          <div className="flex gap-4 mb-8 border-b border-white/10 pb-2">
            <button onClick={() => setMode("create")} className={`pb-2 text-lg font-bold transition-colors ${mode === "create" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}>Create Studio</button>
            <button onClick={() => setMode("join")} className={`pb-2 text-lg font-bold transition-colors ${mode === "join" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}>Join Studio</button>
          </div>

          {mode === "create" ? (
            <div className="space-y-4 mb-6">
              <p className="text-muted-foreground text-sm mb-4">Create a new command center for your brand.</p>
              <div>
                <label className="text-sm font-medium text-gray-300 ml-1">Studio Name</label>
                <Input 
                  placeholder="e.g., Purejoy Studio" 
                  value={studioName}
                  onChange={(e) => {
                    setStudioName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, "").replace(/(^-|-$)+/g, ""));
                  }}
                  className="mt-1 bg-black/50 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 ml-1">Your Studio Link</label>
                <div className="flex items-center mt-1">
                  <span className="bg-black/80 border border-white/20 border-r-0 rounded-l-md px-3 py-2 text-gray-500 text-sm h-10 flex items-center">lume.com/</span>
                  <Input 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ""))}
                    className="rounded-l-none bg-black/50 border-white/20 text-white h-10"
                  />
                </div>
              </div>
              <Button onClick={handleCreateStudio} disabled={loading} className="w-full font-bold mt-4">
                {loading ? "Forging..." : "Initialize Studio"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <p className="text-muted-foreground text-sm mb-4">Enter the 10-character invite code provided by your Admin.</p>
              <div>
                <label className="text-sm font-medium text-gray-300 ml-1">Invite Code</label>
                <Input 
                  placeholder="e.g., xyz45abc85" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toLowerCase())}
                  className="mt-1 bg-black/50 border-white/20 text-white lowercase tracking-widest text-center text-lg"
                  maxLength={10}
                />
              </div>
              <Button onClick={handleJoinStudio} disabled={loading} className="w-full font-bold mt-4 bg-white text-black hover:bg-gray-200">
                {loading ? "Joining..." : "Join Studio"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2: ROLE-BASED DIVERGENCE
  // ==========================================
  
  // If they are NOT an admin (meaning they just joined via code)
  if (currentStudio?.role !== "admin") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel p-8 rounded-xl text-center border border-white/10">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h1 className="text-3xl font-bold mb-2">You're In!</h1>
          <p className="text-muted-foreground mb-8">You have successfully joined <strong>{currentStudio?.name}</strong> as an Editor.</p>
          <Button onClick={completeOnboarding} disabled={loading} className="w-full font-bold bg-white text-black hover:bg-gray-200">
            {loading ? "Loading..." : "Go to Dashboard"}
          </Button>
        </div>
      </div>
    );
  }

  // If they ARE an admin, show the Social Links as normal
  return (
    <div className="min-h-screen bg-bg p-6 md:p-12">
       {/* ... (Keep your exact Platform Grid UI here from the previous step) ... */}
       <header className="text-center mb-8">
          <h1 className="text-4xl font-bold">Connect {currentStudio.name}</h1>
          {/* ... */}
       </header>
    </div>
  );
}