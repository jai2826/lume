import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,10,97,0.08),transparent_50%)]"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-8">
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-brand/10 p-4">
              <Search className="h-12 w-12 text-brand" />
            </div>
          </div>

          {/* 404 display */}
          <div className="mb-4">
            <span className="text-7xl font-bold tracking-tighter text-brand">
              404
            </span>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has
            been moved.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="flex">
              <Button className="h-11 w-full rounded-full bg-brand px-8 font-semibold text-white shadow-glow hover:bg-brand-600 sm:w-auto">
                Return home
              </Button>
            </Link>
            <Link
              href="/selectstudio"
              className="flex">
              <Button
                variant="outline"
                className="h-11 w-full rounded-full border-border font-semibold sm:w-auto sm:px-8">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Footer suggestion */}
          <p className="mt-8 text-sm text-muted-foreground">
            Lost? Try exploring from the{" "}
            <Link
              href="/"
              className="font-medium text-foreground underline-offset-2 transition-colors hover:underline">
              home page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
