"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandCanvas } from "@/components/brand/BrandCanvas";
import { Button } from "@/components/ui/button";
import { PlatformKey } from "@/lib/types";

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  youtube: "YouTube",
  snapchat: "Snapchat",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
};

export default function OAuthConnectedPage() {
  const searchParams = useSearchParams();
  const platform = searchParams.get("platform") as PlatformKey | null;
  const platformLabel = platform ? PLATFORM_LABELS[platform] : "social account";
  const [hasOpener, setHasOpener] = useState(false);

  useEffect(() => {
    setHasOpener(Boolean(window.opener));
    window.opener?.postMessage(
      {
        type: "OAUTH_SUCCESS",
        platform,
      },
      window.location.origin,
    );
  }, [platform]);

  const closeWindow = () => {
    window.close();
  };

  return (
    <BrandCanvas>
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Connection complete
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Your {platformLabel} account is connected to Lume
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            You can close this window and return to your studio. If the window
            stays open, use the button below.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={closeWindow} className="h-11 rounded-full px-5 font-medium">
              Close window
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground/80">
            {hasOpener
              ? "Your studio has been notified automatically."
              : "This page can be closed manually."}
          </p>
        </div>
      </div>
    </BrandCanvas>
  );
}