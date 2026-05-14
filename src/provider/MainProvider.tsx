import { TooltipProvider } from "@/components/ui/tooltip";
import ConvexClientProvider from "@/provider/ConvexClientProvider";
import { JotaiProvider } from "@/provider/JotaiProvider";
import { StudioProvider } from "@/provider/StudioHydrationProvider";

import { ClerkProvider } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function MainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authenticate if present. Public routes should remain accessible.
  const { userId } = await auth();
  let initialStudio: { studioId: string; slug: string } | null = null;

  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, unknown>;

    initialStudio =
      typeof metadata.lastActiveStudioSlug === "string" &&
      typeof metadata.lastActiveStudioId === "string"
        ? {
            studioId: metadata.lastActiveStudioId,
            slug: metadata.lastActiveStudioSlug,
          }
        : null;
  }

  return (
    <ClerkProvider
      unsafe_disableDevelopmentModeConsoleWarning
      afterSignOutUrl={"/"}>
      <ConvexClientProvider>
        <JotaiProvider>
          <StudioProvider initialStudio={initialStudio}>
            <TooltipProvider>{children}</TooltipProvider>
          </StudioProvider>
        </JotaiProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
