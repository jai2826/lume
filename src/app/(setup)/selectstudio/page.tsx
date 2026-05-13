'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { UserButton } from '@clerk/nextjs';
import { Layers, Plus, HelpCircle, Loader2 } from 'lucide-react';

import { api } from '../../../../convex/_generated/api'; // Adjust path if needed
import { useStudioNavigation } from '@/hooks/useStudioNavigation';
import { LumeLogo } from '@/components/brand/logo'; // Adjust path if needed
import { Button } from '@/components/ui/button';

export default function StudioSelectPage() {
  const router = useRouter();
  const { selectStudio } = useStudioNavigation();
  const [hoverId, setHoverId] = useState<string | null>(null);

  // 1. Fetch real data from your Convex backend
  const studios = useQuery(api.studios.getMyStudios);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Real Header with Clerk Auth */}
      <header className="flex items-center justify-between border-b border-black/5 px-12 py-6 bg-background/80 backdrop-blur-md">
        <LumeLogo size={40} />
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-5 w-5" /> Help
          </button>
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
             <UserButton  />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 pt-28 pb-24 flex-1 w-full">
        <div className="text-center">
          <h1 className="text-6xl font-bold tracking-tight md:text-7xl">Select a Studio</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Choose a workspace to continue or create a new one to start a fresh project.
          </p>
        </div>

        {/* Loading State */}
        {studios === undefined && (
          <div className="mt-28 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
            <p className="mt-5 text-base">Loading your workspaces...</p>
          </div>
        )}

        {/* Real Data Grid */}
        {studios !== undefined && (
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {studios.map((s) => {
              const isHover = hoverId === s._id;
              
              return (
                <button 
                  key={s._id}
                  onMouseEnter={() => setHoverId(s._id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => selectStudio(s._id, s.slug)} // Triggers Jotai + Navigation
                  className={`group relative overflow-hidden rounded-3xl border bg-card p-7 text-left transition-all duration-300
                    ${isHover ? 'border-foreground/20 shadow-soft -translate-y-1 scale-[1.01]' : 'border-black/5 shadow-feather'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                      <Layers className="h-5 w-5 text-foreground/80" />
                    </div>
                    {/* Hardcoding Admin role visually for now until you add roles to the Convex schema */}
                    <span className="rounded-full border border-brand/20 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand">
                      <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-[1px] rounded-full bg-brand" />
                      Admin
                    </span>
                  </div>
                  
                  <h3 className="mt-8 text-xl font-bold text-foreground group-hover:text-brand transition-colors">
                    {s.name}
                  </h3>
                  
                  {/* Mock description - consider adding this to your Convex Schema */}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {s.slug} workspace
                  </p>
                  
                  <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-4">
                    <div className="flex -space-x-2">
                      {/* Fake team members for visual flair - replace with actual relation data later */}
                      <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-card bg-muted">
                        <img src={`https://i.pravatar.cc/60?img=11`} alt="" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button 
            onClick={() => router.push('/joinstudio')} 
            variant="outline" 
            className="h-12 rounded-full border-black/5 bg-card px-7 shadow-feather hover:bg-accent hover:text-brand transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> Create or Join a new Studio
          </Button>
        </div>
      </main>

      <footer className="border-t border-black/5 py-6 mt-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-8 text-xs text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">System Status</span>
        </div>
      </footer>
    </div>
  );
}