import { setLastActiveStudio } from "@/actions/studio";
import { activeStudioAtom } from "@/atom/studioAtoms";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";

export function useStudioNavigation() {
  const router = useRouter();
  const setStudio = useSetAtom(activeStudioAtom);

  const selectStudio = async (
    studioId: string,
    slug: string,
    skipNavigation: boolean = false,
  ) => {
    // 1. GENUINE OPTIMISTIC UI: Update Jotai FIRST. 
    // The dropdown changes instantly. Zero latency for the user.
    setStudio({ studioId, slug });

    try {
      // 2. Sync with the server. 
      await setLastActiveStudio(studioId, slug);
    } catch (error) {
      // 3. Graceful fallback: Log it, but don't break the app. 
      // Jotai already has the state, so the user can keep working locally.
      console.error("Failed to save default studio to Clerk:", error);
    } finally {
      // 4. Handle navigation in the finally block. 
      // This guarantees the routing rules are respected whether Clerk succeeded or failed.
      if (!skipNavigation) {
        router.push(`/${slug}/dashboard`);
      }
    }
  };

  // Removed the pointless async
  const createStudio = () => {
    router.push("/joinstudio");
  };

  return { selectStudio, createStudio };
}