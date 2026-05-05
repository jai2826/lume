import  ConvexClientProvider  from "@/app/_provider/ConvexClientProvider";
import { JotaiProvider } from "@/app/_provider/JotaiProvider";
import { ClerkProvider } from "@clerk/nextjs";

export function MainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider unsafe_disableDevelopmentModeConsoleWarning  afterSignOutUrl={"/"}>
      <ConvexClientProvider>
        <JotaiProvider>{children}</JotaiProvider>;
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
