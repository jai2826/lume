// File: src/app/[slug]/_components/StudioSlugSync.tsx
"use client";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { useStudioCacheActions } from "@/hooks/useStudioCache";
import { useQuery } from "convex/react";
import { useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";


/**
 * This component ensures that the Jotai atom always matches the URL slug.
 * It syncs the URL parameter to the activeStudioAtom on mount and whenever slug changes.
 * This is the SOURCE OF TRUTH for which studio the user is currently in.
 * 
 * How it works:
 * 1. Extract slug from URL params: /studioa/dashboard → slug = "studioa"
 * 2. Fetch studio data from Convex by slug
 * 3. Update activeStudioAtom with the fresh studio data
 * 4. Now Jotai and URL are always in sync
 * 
 * Why this matters:
 * - Each tab has its own URL (/studioa vs /studiob)
 * - Each tab should have independent state
 * - Without this, reloading would show the wrong studio in the switcher
 * - Clerk metadata is global, so it can't be trusted for per-tab state
 */
// export function StudioSlugSync() {
//   const params = useParams();
//   const slug = params.slug as string;
//   const setActiveStudio = useSetAtom(activeStudioAtom);
//   const { upsertStudio } = useStudioCacheActions();
  
//   // Fetch the studio data by slug from Convex
//   // This validates that the user has access to this studio
//   const studio = useQuery(api.studios.getStudioBySlug, { slug });

//   useEffect(() => {
//     // Only sync when we have the studio data
//     // studio === undefined means loading
//     // studio === null means not found or user doesn't have access
//     if (studio) {
//       setActiveStudio({
//         studioId: studio._id,
//         slug: studio.slug,
//       });
//       upsertStudio({
//         _id: studio._id,
//         name: studio.name,
//         slug: studio.slug,
//       });
//     }
//   }, [slug, studio, setActiveStudio, upsertStudio]);

//   // This component doesn't render anything - it's purely a side effect
//   // The actual rendering is handled by Sidebar, TopBar, and children
//   return null;
// }