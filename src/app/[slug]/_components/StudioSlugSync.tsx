"use client";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { useStudioCacheActions } from "@/hooks/useStudioCache";
import { useQuery } from "convex/react";
import { useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";

export function StudioSlugSync() {
  const params = useParams();
  const slug = params.slug as string;
  const setActiveStudio = useSetAtom(activeStudioAtom);
  const { upsertStudio } = useStudioCacheActions();

  const studio = useQuery(api.studios.getStudioBySlug, { slug });

  useEffect(() => {
    if (studio) {
      setActiveStudio({ studioId: studio._id, slug: studio.slug });
      upsertStudio({ _id: studio._id, name: studio.name, slug: studio.slug });
    }
  }, [slug, studio, setActiveStudio, upsertStudio]);

  return null;
}