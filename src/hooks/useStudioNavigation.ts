import { activeStudioIdAtom } from "@/atom/studioAtoms";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";; // Adjust path as needed

export function useStudioNavigation() {
  const router = useRouter();
  const setStudioId = useSetAtom(activeStudioIdAtom);

  const useSelectStudio = (studioId: string, slug: string) => {
    // 1. Save the ID for the machine (Convex queries/mutations)
    setStudioId(studioId);

    // 2. Push the Slug for the user (The clean URL)
    router.push(`/${slug}/dashboard`);
  };

  return { useSelectStudio };
}