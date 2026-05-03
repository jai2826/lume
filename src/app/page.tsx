import { ConvexPing } from "@/components/convex-ping";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-background px-6 py-24 font-sans">
      <div className="flex max-w-lg flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Lume
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Distribution infrastructure for creators
        </h1>
        <p className="text-pretty text-muted-foreground">
          Next.js 16, Tailwind v4, shadcn/ui, and Convex are wired up. Extend
          from here with schedules, channels, and analytics.
        </p>
      </div>
      <ConvexPing />
    </div>
  );
}
