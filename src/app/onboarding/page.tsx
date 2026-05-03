import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function OnboardingContent() {
  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/");
  }

  // TODO: Once Clerk auth is properly integrated with Convex middleware,
  // fetch the user's hasCompletedOnboarding status from Convex
  // For MVP, we'll skip this check and always show the modal on /onboarding
  //
  // const user = await convex.query(api.auth.getCurrentUser);
  // if (user?.hasCompletedOnboarding) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <OnboardingModal clerkUserId={userId} />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="text-muted text-sm">Loading onboarding...</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
