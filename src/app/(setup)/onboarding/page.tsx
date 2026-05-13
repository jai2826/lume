"use client";

import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import {
    Loader2,
    Music2
} from "lucide-react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { Button } from "@/components/ui/button";
import {
    FaInstagram,
    FaSnapchat,
    FaXTwitter,
    FaYoutube,
} from "react-icons/fa6";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const STEPS = [
  {
    key: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    color: "#FF0000",
    desc: "Publish Shorts & track channel analytics.",
    perms: [
      "Upload & publish videos",
      "View channel analytics",
    ],
  },
  {
    key: "x",
    label: "X (Twitter)",
    Icon: FaXTwitter,
    color: "#0F1419",
    desc: "Draft threads & monitor conversations.",
    perms: ["Post tweets & threads", "View analytics"],
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: Music2,
    color: "#000000",
    desc: "Schedule short-form videos & monitor trends.",
    perms: ["Upload videos", "Read engagement metrics"],
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    color:
      "conic-gradient(from 45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)",
    desc: "Publish Reels & Stories.",
    perms: ["Publish Reels", "Read insights"],
  },
  {
    key: "snapchat",
    label: "Snapchat",
    Icon: FaSnapchat,
    color: "#FFFC00",
    desc: "Schedule Stories & Spotlight content.",
    perms: ["Post Stories", "View analytics"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [connectingPlatform, setConnectingPlatform] =
    useState<string | null>(null);

  const jotaiStudio = useAtomValue(activeStudioAtom);
  const urlStudioId = sp.get("studio");
  const activeId = jotaiStudio?.studioId || urlStudioId;

  const currentStudio = useQuery(api.studios.getMyStudios);
  const linkedAccounts = useQuery(
    api.auth.getStudioLinkedAccounts,
    {
      studioId: activeId as Id<"studios">,
    },
  );

  useEffect(() => {
    if (linkedAccounts) {
      const firstUnconnectedIndex = STEPS.findIndex(
        (s) => !(linkedAccounts[s.key]?.length > 0),
      );
      if (
        firstUnconnectedIndex !== -1 &&
        firstUnconnectedIndex > step
      ) {
        setStep(firstUnconnectedIndex);
      }
    }
  }, [linkedAccounts, step]);

  if (
    currentStudio === undefined ||
    linkedAccounts === undefined
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  if (currentStudio === null || !activeId) {
    router.push("/selectstudio");
    return null;
  }

  const current = STEPS[step];
  const isConnected =
    (linkedAccounts![current.key]?.length ?? 0) > 0;

  const handleConnect = (platformKey: string) => {
    if (linkedAccounts![platformKey]?.length > 0) return;

    setConnectingPlatform(platformKey);
    const authUrl = `/api/onboarding/${platformKey}/auth?studioId=${activeId}`;

    const width = 500,
      height = 700;
    const left = window.screen.width / 2 - width / 2,
      top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "OAuthWindow",
      `width=${width},height=${height},top=${top},left=${left}`,
    );

    if (!popup) {
      toast.error("Pop-up blocked.");
      setConnectingPlatform(null);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (
        event.data?.type === "OAUTH_SUCCESS" &&
        event.data?.platform === platformKey
      ) {
        setConnectingPlatform(null);
        toast.success(`${platformKey} connected!`);
        window.removeEventListener(
          "message",
          handleMessage,
        );
      }
    };
    window.addEventListener("message", handleMessage);
  };

  const nextStep = () =>
    step < STEPS.length - 1
      ? setStep(step + 1)
      : finishOnboarding();

  const finishOnboarding = () => {
    setIsFinalizing(true);
    const studio = currentStudio.find(s => s._id === activeId) || currentStudio[0];
    router.push(`/${studio.slug}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-8 pt-12 pb-24">
        <div className="mt-28 text-center">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">
            Connect {current.label}
          </h1>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {[current, STEPS[(step + 1) % STEPS.length]].map(
            (p, idx) => {
              const st =
                (linkedAccounts![p.key]?.length ?? 0) > 0
                  ? "active"
                  : "disconnected";
              const isMain = idx === 0;
              return (
                <div
                  key={p.key}
                  className={`relative overflow-hidden rounded-3xl border bg-card p-9 transition-all ${isMain ? "border-black/10 shadow-soft scale-100 opacity-100" : "border-black/5 shadow-feather scale-95 opacity-60"}`}>
                  <div className="relative">
                    <div
                      className="grid h-20 w-20 place-items-center rounded-2xl shadow-sm"
                      style={{ background: p.color }}>
                      <p.Icon
                        className={`h-9 w-9 text-white`}
                      />
                    </div>
                    <h3 className="mt-5 text-3xl font-bold text-foreground">
                      {p.label}
                    </h3>

                    {isMain && (
                      <Button
                        onClick={() =>
                          isConnected
                            ? nextStep()
                            : handleConnect(p.key)
                        }
                        disabled={
                          connectingPlatform === p.key
                        }
                        className="mt-5 h-11 w-full rounded-xl transition-all shadow-sm bg-foreground text-background">
                        {connectingPlatform === p.key ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Connecting...
                          </>
                        ) : st === "active" ? (
                          "Manage Connection"
                        ) : (
                          `Connect ${p.label}`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-14 flex justify-center">
          <Button
            onClick={nextStep}
            disabled={isFinalizing}
            className="h-12 rounded-full bg-brand px-10 font-semibold text-white shadow-glow hover:bg-brand-600 transition-all">
            {isFinalizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                Finalizing...
              </>
            ) : step === STEPS.length - 1 ? (
              "Complete Setup ✓"
            ) : isConnected ? (
              "Continue to Next Platform →"
            ) : (
              "Skip Platform →"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
