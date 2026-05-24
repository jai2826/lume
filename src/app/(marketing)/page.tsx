import type { Metadata } from "next";
import Link from "next/link";

// import { LandingShowcaseBento } from "@/components/marketing/landing-showcase-bento";
import GetStartedButton from "@/app/(marketing)/_components/get-started-button";
import OpenStudioButton from "@/app/(marketing)/_components/open-studio-button";
import { BrandCanvas } from "@/components/brand/BrandCanvas";
import { cn } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Lume — Distribution for creators who curate",
  description:
    "Composer-native distribution: one shot, every surface. Premium creative workspace for teams who ship at scale.",
};

const PLATFORMS = [
  "YouTube",
  "Instagram",
  "X",
  "TikTok",
  "Snapchat",
];

export default async function MarketingLandingPage() {
  const user = await currentUser();
  const slug =
    (user?.publicMetadata
      ?.lastActiveStudioSlug as string) ?? "";

  return (
    <BrandCanvas>
      <section className="relative z-[1] mx-auto flex w-full max-w-[1400px] flex-col px-6 pb-24 pt-14 ">
        <header className="rounded-[2.5rem] border border-border/70 bg-card/85 px-8 py-14 text-center shadow-soft backdrop-blur-md sm:px-12 sm:py-18 lg:px-16">
          <span className="mx-auto inline-flex rounded-full border border-brand/20 bg-brand/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.32em] text-foreground/80 animate-in fade-in slide-in-from-bottom-3 duration-700">
            Composer-native distribution
          </span>

          <div className="mt-9 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 fill-mode-backwards">
            <h1 className="font-semibold leading-[0.96] tracking-[-0.03em] text-[clamp(2.5rem,8.1vw,5.2rem)] text-foreground sm:tracking-[-0.038em]">
              <span className="block mx-auto max-w-4xl">
                One master cut.
                <br />
                Every channel, gallery-grade.
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-balance text-[1.12rem] leading-relaxed text-muted-foreground sm:mt-10 sm:text-[1.3rem]">
              Lume is the creative OS for outbound:
              composition, Convex-backed live previews, and
              platform fidelity without the grunt work.
            </p>

            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3">
              {PLATFORMS.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border bg-background/95 px-4 py-2 text-base font-medium text-foreground/80">
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards sm:flex-row sm:gap-7">
            <GetStartedButton />
            <OpenStudioButton />
          </div>
        </header>
      </section>

      <section className="relative z-[1] mx-auto w-full max-w-[1480px] px-6 pb-28 sm:px-10 sm:pb-36">
        <div className="mb-14 rounded-[2rem] border border-border/70 bg-card/80 px-8 py-10 text-center shadow-feather backdrop-blur sm:mb-18 sm:px-12 sm:py-12 sm:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.3rem]">
            Platform fidelity, before you publish
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[1.1rem] leading-relaxed text-muted-foreground sm:mx-0 sm:text-lg lg:max-w-4xl">
            Each surface below is mocked as if your shot
            already shipped, with familiar chrome,
            typography, and media constraints your team can
            parse at a glance.
          </p>
        </div>
        {/* <LandingShowcaseBento /> */}
      </section>

      <footer className="relative z-[1] border-t border-border/65 bg-background/70 py-16 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-8 px-6 text-center sm:px-10">
          <p className="max-w-2xl text-[1.1rem] leading-relaxed text-muted-foreground sm:text-lg">
            Writers, editors, operators converge on one
            Convex-backed shot canvas. Invite your desk in
            the next sprint.
          </p>
          <Link
            href="/sign-up"
            className={cn(
              "inline-flex min-h-[3.75rem] items-center justify-center rounded-full border border-transparent px-14 text-lg font-semibold text-white transition-[transform,box-shadow,background-color] active:translate-y-px",
              "bg-brand shadow-glow hover:bg-brand-600",
            )}
            prefetch={false}>
            Start with Lume
          </Link>
        </div>
      </footer>
    </BrandCanvas>
  );
}
