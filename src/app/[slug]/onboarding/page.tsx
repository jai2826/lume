"use client";

import { useAtomValue } from "jotai";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LinkedStatus } from "@/app/[slug]/_components/LinkedStatus";
import { activeStudioAtom } from "@/atom/studioAtoms";
import { BrandCanvas } from "@/components/brand/BrandCanvas";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  useCachedStudioLinkedAccounts,
  useCachedStudios,
  useStudioCacheActions,
} from "@/hooks/useStudioCache";
import { connectAccount } from "@/lib/connect-account";
import { PLATFORMS } from "@/lib/constants";
import { PlatformKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEP_DETAILS: Record<
  PlatformKey,
  { description: string; permissions: string[] }
> = {
  youtube: {
    description:
      "Publish Shorts and track channel analytics.",
    permissions: [
      "Upload and publish videos",
      "View channel analytics",
    ],
  },
  x: {
    description: "Draft threads and monitor conversations.",
    permissions: [
      "Post tweets and threads",
      "View analytics",
    ],
  },
  tiktok: {
    description:
      "Schedule short-form videos and monitor trends.",
    permissions: [
      "Upload videos",
      "Read engagement metrics",
    ],
  },
  instagram: {
    description: "Publish Reels and Stories.",
    permissions: ["Publish Reels", "Read insights"],
  },
  snapchat: {
    description: "Schedule Stories and Spotlight content.",
    permissions: ["Post Stories", "View analytics"],
  },
};

const STEPS = PLATFORMS.map((platform) => ({
  ...platform,
  description: STEP_DETAILS[platform.key].description,
  permissions: STEP_DETAILS[platform.key].permissions,
}));

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [connectingPlatform, setConnectingPlatform] =
    useState<PlatformKey | null>(null);
  const [carouselApi, setCarouselApi] =
    useState<CarouselApi | null>(null);
  const didInitializeCarousel = useRef(false);

  const jotaiStudio = useAtomValue(activeStudioAtom);
  const urlStudioId = searchParams.get("studio");
  const activeId = jotaiStudio?.studioId || urlStudioId;

  const {
    studios: currentStudio,
    isLoading: studiosLoading,
  } = useCachedStudios();
  const {
    accounts: linkedAccounts,
    isLoading: linkedAccountsLoading,
  } = useCachedStudioLinkedAccounts(activeId);
  const { invalidateLinkedAccounts } =
    useStudioCacheActions();

  const currentStep = STEPS[activeIndex];
  const currentLinkedAccounts =
    linkedAccounts?.[currentStep.key] ?? [];
  const linkedPlatformCount = STEPS.reduce(
    (total, platform) =>
      total +
      ((linkedAccounts?.[platform.key]?.length ?? 0) > 0
        ? 1
        : 0),
    0,
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      carouselApi &&
      linkedAccounts &&
      !didInitializeCarousel.current
    ) {
      const firstUnconnectedIndex = STEPS.findIndex(
        (s) => !(linkedAccounts[s.key]?.length > 0),
      );
      if (firstUnconnectedIndex !== -1) {
        carouselApi.scrollTo(firstUnconnectedIndex);
      }

      didInitializeCarousel.current = true;
    }
  }, [carouselApi, linkedAccounts]);

  useEffect(() => {
    if (!carouselApi) return;

    const syncIndex = () => {
      setActiveIndex(carouselApi.selectedScrollSnap());
    };

    syncIndex();
    carouselApi.on("select", syncIndex);
    carouselApi.on("reInit", syncIndex);

    return () => {
      carouselApi.off("select", syncIndex);
      carouselApi.off("reInit", syncIndex);
    };
  }, [carouselApi]);

  if (
    !isMounted ||
    studiosLoading ||
    linkedAccountsLoading
  ) {
    return (
      <BrandCanvas>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
        </div>
      </BrandCanvas>
    );
  }

  if (!activeId || currentStudio.length === 0) {
    router.push("/activestudios");
    return null;
  }

  const handleConnect = async (
    platformKey: PlatformKey,
  ) => {
    setConnectingPlatform(platformKey);
    try {
      const currentStudioRecord =
        currentStudio.find((s) => s._id === activeId) ??
        currentStudio[0];

      const success = await connectAccount({
        platform: platformKey,
        studioId: activeId,
        studioSlug: currentStudioRecord?.slug,
        onPopupBlocked: () => {
          toast.error("Pop-up blocked.");
        },
      });

      if (success) {
        const platformLabel =
          STEPS.find((step) => step.key === platformKey)
            ?.label ?? platformKey;
        toast.success(`${platformLabel} connected!`);
        invalidateLinkedAccounts(activeId);
      }
    } finally {
      setConnectingPlatform(null);
    }
  };

  const nextStep = () => {
    if (activeIndex < STEPS.length - 1) {
      carouselApi?.scrollNext();
      return;
    }

    finishOnboarding();
  };

  const goToPrevious = () => {
    carouselApi?.scrollPrev();
  };

  const finishOnboarding = () => {
    setIsFinalizing(true);
    const studio =
      currentStudio.find((s) => s._id === activeId) ||
      currentStudio[0];
    router.push(`/${studio.slug}/dashboard`);
  };

  const stepLabel = activeIndex + 1;

  return (
    <BrandCanvas>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Platform connections
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Connect your studio accounts
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Move through each platform in a carousel,
                connect accounts, and skip anything you want
                to return to later.
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur md:block">
            Step {stepLabel} of {STEPS.length}
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
          <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,10,97,0.10),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,10,97,0.06),transparent_28%)]" />
            <div className="relative flex items-center justify-between gap-3 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Current platform
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {currentStep.label}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={activeIndex === 0}
                  className="rounded-full border border-border/60 bg-background/60 shadow-sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextStep}
                  className="rounded-full border border-border/60 bg-background/60 shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Carousel
              opts={{ align: "start" }}
              setApi={setCarouselApi}
              className="relative">
              <CarouselContent className="-ml-4">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isStepLinked =
                    (linkedAccounts?.[step.key]?.length ??
                      0) > 0;
                  const isConnecting =
                    connectingPlatform === step.key;

                  return (
                    <CarouselItem
                      key={step.key}
                      className="pl-4 md:basis-full">
                      <article className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/90 p-6 sm:p-8">
                        <div
                          className={cn(
                            "absolute inset-0 opacity-60",
                            "bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.12))]",
                          )}
                        />
                        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                          <div className="space-y-5">
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "grid h-16 w-16 shrink-0 place-items-center rounded-2xl shadow-lg text-white",
                                  `bg-gradient-to-br ${step.accent}`,
                                )}>
                                <Icon className="h-8 w-8" />
                              </div>

                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                                    {step.label}
                                  </h3>
                                  <span
                                    className={cn(
                                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                      isStepLinked
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground",
                                    )}>
                                    {isStepLinked
                                      ? "Linked"
                                      : "Unlinked"}
                                  </span>
                                </div>
                                <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                                  {step.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {step.permissions.map(
                                (permission) => (
                                  <span
                                    key={permission}
                                    className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                                    {permission}
                                  </span>
                                ),
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <Button
                                onClick={() =>
                                  handleConnect(step.key)
                                }
                                disabled={
                                  isConnecting ||
                                  isFinalizing
                                }
                                className="h-11 rounded-full bg-foreground px-5 text-background shadow-sm transition-all hover:bg-foreground/90">
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                  </>
                                ) : isStepLinked ? (
                                  "Manage connection"
                                ) : (
                                  `Connect ${step.label}`
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                onClick={nextStep}
                                disabled={isFinalizing}
                                className="h-11 rounded-full border border-border/60 bg-background/70 px-5 text-foreground shadow-sm">
                                {activeIndex ===
                                STEPS.length - 1
                                  ? "Finish setup"
                                  : "Continue"}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                    Accounts already linked
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-foreground">
                                    {
                                      currentLinkedAccounts.length
                                    }{" "}
                                    connected
                                  </p>
                                </div>
                                <div className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                                  {stepLabel}/{STEPS.length}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                {currentLinkedAccounts.length >
                                0 ? (
                                  currentLinkedAccounts.map(
                                    (account) => (
                                      <div
                                        key={account._id}
                                        className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-3 py-2">
                                        <span className="text-sm font-medium text-foreground">
                                          @
                                          {
                                            account.accountName
                                          }
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          Connected
                                        </span>
                                      </div>
                                    ),
                                  )
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border/70 bg-background px-3 py-4 text-sm text-muted-foreground">
                                    No accounts linked yet
                                    for this platform.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-3xl border border-border/60 bg-background/80 p-4 shadow-sm">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Workflow hint
                              </p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Connect what you need now,
                                then use the skip rail to
                                move through the rest
                                without losing your place.
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious className="left-2 hidden rounded-full border-border/60 bg-card/90 shadow-sm lg:flex" />
              <CarouselNext className="right-2 hidden rounded-full border-border/60 bg-card/90 shadow-sm lg:flex" />
            </Carousel>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Skip rail
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Not ready yet?
                  </h3>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={isFinalizing}
                  className="h-11 rounded-full bg-brand px-4 text-white shadow-glow transition-all hover:bg-brand-600">
                  {activeIndex === STEPS.length - 1 ? (
                    "Complete setup"
                  ) : (
                    <>
                      Skip
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Skip this platform and move to the next card
                in the carousel.
              </p>
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <LinkedStatus
                variant="dropdown"
                className="p-0 max-h-none overflow-visible"
                title="Linked overview"
                description="A quick read on which accounts are already connected and which still need work."
                accounts={linkedAccounts}
                onConnectPlatform={handleConnect}
              />
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Setup status
              </p>
              <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Active studio</span>
                  <span className="font-medium text-foreground">
                    {currentStudio?.find(
                      (studio) => studio._id === activeId,
                    )?.slug ?? activeId}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Current step</span>
                  <span className="font-medium text-foreground">
                    {stepLabel} of {STEPS.length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Linked platforms</span>
                  <span className="font-medium text-foreground">
                    {linkedPlatformCount}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </BrandCanvas>
  );
}
