"use client";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AlertTriangle, ArrowLeft, House } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

function getErrorMessage(error: Error) {
  const message = error.message?.trim();

  if (!message || message === "Error") {
    return "Something went wrong. Please try again.";
  }

  return message.length > 140 ? `${message.slice(0, 137)}...` : message;
}

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Critical application error:", error);
    toast.error(getErrorMessage(error));
  }, [error]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <html>
      <body>
        <Toaster />
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
                The application hit a critical issue. You can go back or return
                home to continue safely.
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
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={reset}
                  className="h-11 rounded-full bg-brand px-8 font-semibold text-white shadow-glow transition-colors hover:bg-brand-600 active:translate-y-px"
                >
                  Restart application
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="h-11 rounded-full border-border font-semibold sm:px-8"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go back
                </Button>
                <Link href="/" className="flex">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-full border-border font-semibold sm:w-auto sm:px-8"
                  >
                    <House className="mr-2 h-4 w-4" />
                    Back to home
                  </Button>
                </Link>
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
