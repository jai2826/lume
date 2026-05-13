"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="relative min-h-screen bg-background">
          {/* Ambient accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,10,97,0.12),transparent_50%)]"
          />

          <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-8">
            <div className="w-full max-w-md text-center">
              {/* Icon */}
              <div className="mb-8 flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>

              {/* Content */}
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Critical error
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                The application encountered a critical error and needs to restart.
              </p>

              {/* Error details (dev only) */}
              {process.env.NODE_ENV === "development" && error.message && (
                <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
                  <p className="text-sm font-mono text-destructive">
                    {error.message}
                  </p>
                  {error.stack && (
                    <pre className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={reset}
                  className="h-11 rounded-full bg-brand px-8 font-semibold text-white shadow-glow transition-colors hover:bg-brand-600 active:translate-y-px"
                >
                  Restart application
                </button>
              </div>

              {/* Footer */}
              <p className="mt-8 text-sm text-muted-foreground">
                If the problem persists, please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
