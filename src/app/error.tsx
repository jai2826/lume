"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

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
              <AlertCircle className="h-12 w-12 text-brand" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
          </p>

          {/* Error details (dev only) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
              <p className="text-sm font-mono text-destructive">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={reset}
              className="h-11 rounded-full bg-brand px-8 font-semibold text-white shadow-glow hover:bg-brand-600"
            >
              Try again
            </Button>
            <Link href="/" className="flex">
              <Button
                variant="outline"
                className="h-11 w-full rounded-full border-border font-semibold sm:w-auto sm:px-8"
              >
                Back to home
              </Button>
            </Link>
          </div>

          {/* Footer link */}
          <Link
            href="mailto:support@lume.app"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Need help? Contact support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
