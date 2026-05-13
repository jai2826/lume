import { TooltipProvider } from "@/components/ui/tooltip";
import ConvexClientProvider from "@/provider/ConvexClientProvider";
import { JotaiProvider } from "@/provider/JotaiProvider";

import { ClerkProvider } from "@clerk/nextjs";

export function MainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      unsafe_disableDevelopmentModeConsoleWarning
      afterSignOutUrl={"/"}>
      <ConvexClientProvider>
        <JotaiProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </JotaiProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
