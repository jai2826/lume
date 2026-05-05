"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "../../../../convex/_generated/api";
import { useStudioNavigation } from "@/hooks/useStudioNavigation";

export default function SelectStudioPage() {
  const router = useRouter();
  const studios = useQuery(api.studios.getMyStudios);
  const [isRouting, setIsRouting] = useState(false);
  const { useSelectStudio } = useStudioNavigation();

  useEffect(() => {
    // 1. Wait for data to load
    if (studios === undefined) return;

    // 2. If they have NO studios, force them to Setup
    if (studios.length === 0) {
      router.push("/joinstudio");
      return;
    }

    // 3. If they have EXACTLY ONE studio, skip this page and auto-login
    // if (studios.length === 1 && !isRouting) {
    //   setIsRouting(true);
    //   useSelectStudio(studios[0]._id, studios[0].slug);
    // }
  }, [studios, router, isRouting]);

  // Loading state
  if (studios === undefined || studios.length <= 1) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="animate-pulse text-white text-xl font-bold">
          Loading Command Center...
        </div>
      </div>
    );
  }

  // They have multiple studios. Let them choose.
  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Select a Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose which workspace you want to enter.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div
              key={studio._id}
              onClick={() =>
                useSelectStudio(studio._id, studio.slug)
              }
              className="glass-panel p-6 rounded-xl border border-white/10 hover:border-white/30 cursor-pointer transition-all hover:bg-white/5 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                {studio.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {studio.name}
              </h2>
              <span
                className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold ${
                  studio.role === "admin"
                    ? "bg-red-500/20 text-red-400"
                    : studio.role === "editor"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}>
                {studio.role}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/joinstudio")}
            className="text-gray-400 hover:text-white">
            + Create or Join another Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
