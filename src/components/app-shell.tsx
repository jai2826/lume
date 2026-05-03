import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-[color:rgba(255,255,255,0.06)] bg-background/55 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/35">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[3.25rem] w-full max-w-6xl items-center justify-between gap-6 px-5 sm:h-14 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 tracking-tight text-foreground transition-opacity hover:opacity-80">
            <span
              aria-hidden
              className="size-5 rounded-[0.375rem] border border-brand-accent/35 bg-brand-accent/10 backdrop-blur-sm"
            />
            <span className="text-sm font-semibold sm:text-[0.9375rem]">
              Lume
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {(["Studio", "Channels", "Analytics"] as const).map((item) => (
              <Link
                key={item}
                href={item === "Studio" ? "/dashboard" : "#"}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="#"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  size: "sm",
                }),
              )}>
              Sign in
            </Link>
            <Link
              href="#"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                }),
              )}>
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
