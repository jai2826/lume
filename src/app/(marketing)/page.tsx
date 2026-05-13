import type { Metadata } from "next";
import Link from "next/link";

// import { LandingShowcaseBento } from "@/components/marketing/landing-showcase-bento";
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

  const dashboardLink = slug
    ? `/${slug}/dashboard`
    : "/dashboard";

  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_8%,rgba(250,10,97,0.12),transparent_35%),radial-gradient(circle_at_88%_22%,rgba(250,10,97,0.08),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,1)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-grid opacity-35"
      />

      <section className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-col px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-18 lg:pt-22">
        <header className="rounded-[2rem] border border-border/70 bg-card/85 px-6 py-10 text-center shadow-soft backdrop-blur-md sm:px-10 sm:py-14 lg:px-14">
          <span className="mx-auto inline-flex rounded-full border border-brand/20 bg-brand/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground/80 animate-in fade-in slide-in-from-bottom-3 duration-700">
            Composer-native distribution
          </span>

          <div className="mt-7 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150 fill-mode-backwards">
            <h1 className="font-semibold leading-[0.96] tracking-[-0.03em] text-[clamp(2.2rem,8.1vw,4.9rem)] text-foreground sm:tracking-[-0.038em]">
              <span className="block mx-auto max-w-4xl">
                One master cut.
                <br />
                Every channel, gallery-grade.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-balance text-[1.05rem] leading-relaxed text-muted-foreground sm:mt-9 sm:text-[1.22rem]">
              Lume is the creative OS for outbound:
              composition, Convex-backed live previews, and
              platform fidelity without the grunt work.
            </p>

            <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
              {PLATFORMS.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border bg-background/95 px-3.5 py-1.5 text-sm font-medium text-foreground/80">
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards sm:flex-row sm:gap-6">
            <Link
              href={dashboardLink}
              className={cn(
                "group relative inline-flex min-h-[3.5rem] items-center justify-center overflow-hidden rounded-full px-10 text-[1.02rem] font-semibold tracking-tight text-white transition-[transform,box-shadow,background-color] active:translate-y-[1px]",
                "bg-brand shadow-glow hover:bg-brand-600",
              )}
              prefetch={false}>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-[-40%] top-[-60%] h-[160%] translate-y-full bg-gradient-to-br from-transparent via-white/35 to-transparent opacity-65 blur-2xl transition-transform duration-700 group-hover:translate-y-[18%]"
              />
              <span className="relative">Get started</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[3.5rem] items-center justify-center rounded-full border border-border bg-background/90 px-8 text-[1.02rem] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground">
              Open studio
            </Link>
          </div>
        </header>
      </section>

      <section className="relative z-[1] mx-auto w-full max-w-[1320px] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mb-12 rounded-[1.6rem] border border-border/70 bg-card/80 px-6 py-8 text-center shadow-feather backdrop-blur sm:mb-16 sm:px-10 sm:py-10 sm:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-[2.1rem]">
            Platform fidelity, before you publish
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[1.03rem] leading-relaxed text-muted-foreground sm:mx-0 sm:text-lg lg:max-w-3xl">
            Each surface below is mocked as if your shot
            already shipped, with familiar chrome,
            typography, and media constraints your team can
            parse at a glance.
          </p>
        </div>
        {/* <LandingShowcaseBento /> */}
      </section>

      <footer className="relative z-[1] border-t border-border/65 bg-background/70 py-14 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-7 px-5 text-center sm:px-8">
          <p className="max-w-xl text-[1.03rem] leading-relaxed text-muted-foreground sm:text-lg">
            Writers, editors, operators converge on one
            Convex-backed shot canvas. Invite your desk in
            the next sprint.
          </p>
          <Link
            href="/sign-up"
            className={cn(
              "inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-transparent px-12 text-base font-semibold text-white transition-[transform,box-shadow,background-color] active:translate-y-px",
              "bg-brand shadow-glow hover:bg-brand-600",
            )}
            prefetch={false}>
            Start with Lume
          </Link>
        </div>
      </footer>
    </div>
  );
}
