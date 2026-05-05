import type { Metadata } from "next";
import Link from "next/link";

// import { LandingShowcaseBento } from "@/components/marketing/landing-showcase-bento";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lume — Distribution for creators who curate",
  description:
    "Composer-native distribution: one shot, every surface. Premium creative workspace for teams who ship at scale.",
};

export default function MarketingLandingPage() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* Ambient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[68vh] bg-[radial-gradient(ellipse_82%_72%_at_50%_-14%,rgba(255,255,255,0.085),transparent_58%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[52vh] bg-[radial-gradient(ellipse_70%_54%_at_50%_112%,rgba(255,255,255,0.038),transparent_55%)] opacity-80" aria-hidden />

      <section className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-col px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-24">
        <header className="flex flex-col gap-10 text-center sm:gap-14">
          
          <span className="mx-auto inline-flex rounded-full border border-brand-accent/25 bg-brand-accent/10 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.35em] text-muted-foreground backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            Composer-native distribution
          </span>

          {/* Using tailwindcss-animate for guaranteed execution */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-backwards">
            <h1 className="font-semibold leading-[0.98] tracking-[-0.035em] text-[clamp(2.75rem,8.4vw,4.75rem)] sm:tracking-[-0.042em]">
              <span className="block max-w-4xl mx-auto bg-gradient-to-br from-[#b6b6b6] via-[#efefef] to-[#ffffff] bg-clip-text text-transparent drop-shadow-[0_0_55px_rgba(255,255,255,0.09)]">
                One master cut.
                <br />
                Every channel, gallery-grade.
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground sm:mt-10 sm:text-[1.25rem] sm:leading-relaxed lg:max-w-3xl">
              Lume is the creative OS for outbound — composition, Convex-backed live previews, and
              platform fidelity without the grunt work.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-backwards">
            <Link
              href="/sign-up"
              className={cn(
                "group relative inline-flex min-h-[3.75rem] items-center justify-center overflow-hidden rounded-full px-14 text-lg font-semibold tracking-tight text-background transition-[transform,box-shadow] active:translate-y-[1px]",
                "bg-brand-accent shadow-[0_0_52px_-6px_rgba(255,255,255,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_0_76px_-4px_rgba(255,255,255,0.55)]",
              )}
              prefetch={false}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-[-40%] top-[-60%] h-[160%] bg-gradient-to-br from-transparent via-white/45 to-transparent opacity-55 blur-3xl transition-transform duration-700 translate-y-full group-hover:translate-y-[18%]" />
              <span className="relative">Get started</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-lg font-medium text-muted-foreground underline-offset-[0.22em] transition-colors hover:text-foreground hover:underline"
            >
              Open studio
            </Link>
          </div>
        </header>
      </section>

      <section className="relative z-[1] mx-auto w-full max-w-[1320px] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mb-12 flex flex-col gap-4 text-center sm:mb-16 sm:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-[2.15rem]">
            Platform fidelity, before you publish
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:mx-0 lg:max-w-3xl lg:text-xl">
            Each surface below is mocked as if your shot already shipped — real chrome, typography, and
            media constraints you can recognize at a glance.
          </p>
        </div>
        {/* <LandingShowcaseBento /> */}
      </section>

      <footer className="relative z-[1] border-t border-border/65 bg-background/50 py-14 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-5 text-center sm:px-8">
          <p className="max-w-xl text-muted-foreground text-lg leading-relaxed">
            Writers, editors, operators — converge on one Convex-backed shot canvas. Invite your desk in
            the next sprint.
          </p>
          <Link
            href="/sign-up"
            className={cn(
              "inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-12 text-lg font-semibold text-background shadow-[0_0_42px_-8px_rgba(255,255,255,0.36)] hover:shadow-[0_0_62px_-4px_rgba(255,255,255,0.48)]",
              "border border-transparent bg-brand-accent transition-[box-shadow,filter] hover:brightness-105 active:brightness-95 active:translate-y-px",
            )}
            prefetch={false}
          >
            Start with Lume
          </Link>
        </div>
      </footer>
    </div>
  );
}