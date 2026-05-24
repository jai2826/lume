"use client";

import { useAtomValue } from "jotai";
import Link from "next/link";
import type { ComponentType } from "react";
import {
    FaInstagram,
    FaSnapchat,
    FaTiktok,
    FaX,
    FaYoutube,
} from "react-icons/fa6";

import { activeStudioAtom } from "@/atom/studioAtoms";
import { useCachedStudioLinkedAccounts } from "@/hooks/useStudioCache";

type Platform = "instagram" | "youtube" | "x" | "tiktok" | "snapchat";

const ICONS: Record<Platform, ComponentType<{ className?: string }>> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  x: FaX,
  tiktok: FaTiktok,
  snapchat: FaSnapchat,
};

export default function SettingsPage() {
  const activeStudio = useAtomValue(activeStudioAtom);
  const studioId = activeStudio?.studioId;

  const { accounts, isLoading } = useCachedStudioLinkedAccounts(studioId);

  if (!studioId) {
    return (
      <div className="mx-auto max-w-5xl p-12">
        <h1 className="mb-4 text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Select an active studio before managing connected accounts.
        </p>
        <Link
          href="/activestudios"
          className="mt-6 inline-block text-base text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          Go to active studios
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-12">
        <h1 className="mb-4 text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Loading connected accounts...</p>
      </div>
    );
  }

  const platforms: Platform[] = [
    "instagram",
    "youtube",
    "x",
    "tiktok",
    "snapchat",
  ];

  return (
    <div className="mx-auto max-w-5xl p-12">
      <h1 className="mb-6 text-4xl font-bold">Settings</h1>
      <p className="mb-8 text-base text-muted-foreground">
        Manage connected social accounts for the active studio.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {platforms.map((platform) => {
          const Icon = ICONS[platform];
          return (
            <AccountList
              key={platform}
              platform={platform}
              accounts={accounts[platform]}
              Icon={Icon}
            />
          );
        })}
      </div>

      <div className="mt-10">
        <Link
          href={`/${activeStudio.slug}/dashboard`}
          className="text-base text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function AccountList({
  platform,
  accounts,
  Icon,
}: {
  platform: Platform;
  accounts: Array<{ accountName: string; _id: string }>;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="rounded bg-muted/10 p-3">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold capitalize">{platform}</h3>
      </div>

      {accounts.length > 0 ? (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li
              key={a._id}
              className="flex items-center justify-between"
            >
              <span className="text-base text-foreground">@{a.accountName}</span>
              <span className="text-sm text-muted-foreground">Connected</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-base text-muted-foreground">No accounts connected</div>
      )}
    </div>
  );
}