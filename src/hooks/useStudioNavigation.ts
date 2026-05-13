import { activeStudioAtom } from "@/atom/studioAtoms";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { setLastActiveStudio } from "@/actions/studio"; // Import your Server Action

export function useStudioNavigation() {
  const router = useRouter();
  const setStudio = useSetAtom(activeStudioAtom);

  const selectStudio = async (
    studioId: string,
    slug: string,
  ) => {
    try {
      // 1. Tell Clerk this is the new default studio (Server Action)
      // We await this so the middleware knows about it BEFORE we navigate
      await setLastActiveStudio(slug);
      console.log(studioId, slug)
      // 2. Save the ID to Jotai for immediate local UI updates
      setStudio({ studioId, slug });

      // 3. Push the user to the dashboard
      router.push(`/${slug}/dashboard`);
    } catch (error) {
      console.error(
        "Failed to save default studio to Clerk:",
        error,
      );

      // Fallback: Even if Clerk fails, don't trap the user.
      // Update local state and let them into the dashboard anyway.
      setStudio({ studioId, slug });
      router.push(`/${slug}/dashboard`);
    }
  };
  const createStudio = async () => {
    router.push("/join-studio");
  };

  return { selectStudio, createStudio };
}
