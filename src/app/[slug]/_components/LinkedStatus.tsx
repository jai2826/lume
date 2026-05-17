"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants";
import { PlatformKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ExternalLink } from "lucide-react";

export type LinkedAccount = {
  _id: string;
  accountName: string;
};

export type LinkedAccountsByPlatform = Partial<
  Record<PlatformKey, LinkedAccount[]>
>;

type LinkedStatusVariant = "standalone" | "dropdown";

interface LinkedStatusProps {
  accounts?: LinkedAccountsByPlatform | null;
  variant?: LinkedStatusVariant;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  onConnectPlatform?: (platform: PlatformKey) => void;
  onAccountClick?: (
    platform: PlatformKey,
    account: LinkedAccount,
  ) => void;
}

const DEFAULT_TITLE = "Linked status";
const DEFAULT_DESCRIPTION =
  "See which accounts are connected and which still need linking.";

export function LinkedStatus({
  accounts,
  variant = "standalone",
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className,
  onConnectPlatform,
  onAccountClick,
}: LinkedStatusProps) {
  const isDropdown = variant === "dropdown";
  const router = useRouter();
  const params = useParams();
  const studioSlug = params.slug as string;

  return (
    <div
      className={cn(
        isDropdown
          ? "space-y-2 m-2  max-h-120 overflow-auto"
          : "rounded-2xl border border-border/70 bg-card p-4 shadow-sm",
        className,
      )}>
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          isDropdown && "px-1",
        )}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={"outline"}
              className={"cursor-pointer"}
              onClick={() =>
                router.push(`/${studioSlug}/onboarding`)
              }
              nativeButton={false}
              render={
                <div className="flex items-center gap-1">
                  <h3
                    className={cn(
                      "font-semibold text-foreground",
                      isDropdown ? "text-sm" : "text-base",
                    )}>
                    {title}
                  </h3>
                  <ExternalLink />
                </div>
              }></Button>
            <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {countLinked(accounts)} linked
            </span>
            {/* <div className="self-end">Open in settings to manage </div> */}
          </div>
          <p
            className={cn(
              "text-muted-foreground",
              isDropdown ? "text-xs" : "text-sm",
            )}>
            {description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "space-y-3",
          isDropdown && "space-y-2",
        )}>
        {PLATFORMS.map((platform) => {
          const platformAccounts =
            accounts?.[platform.key] ?? [];
          const isLinked = platformAccounts.length > 0;
          const Icon = platform.icon;

          return (
            <section
              key={platform.key}
              className={cn(
                "rounded-xl border border-border/60 bg-background/60",
                isDropdown ? "px-3 py-2.5" : "p-4",
              )}>
              <div className=" flex items-start justify-between gap-3">
                <div className="flex w-full items-center gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm",
                      `bg-gradient-to-br ${platform.accent}`,
                    )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className=" min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={cn(
                          "truncate font-medium text-foreground",
                          isDropdown
                            ? "text-sm"
                            : "text-base",
                        )}>
                        {platform.label}
                      </h4>
                      <StatusPill
                        linked={isLinked}
                        count={platformAccounts.length}
                      />
                    </div>

                    <p
                      className={cn(
                        "text-muted-foreground",
                        isDropdown ? "text-xs" : "text-sm",
                      )}>
                      {isLinked
                        ? "Connected account(s)"
                        : "No linked accounts yet"}
                    </p>
                  </div>
                </div>

                {onConnectPlatform ? (
                  <Button
                    variant={
                      isDropdown ? "ghost" : "outline"
                    }
                    size={isDropdown ? "sm" : "default"}
                    className={cn(
                      "shrink-0",
                      isDropdown &&
                        "h-8 rounded-full px-3 text-xs",
                    )}
                    onClick={() =>
                      onConnectPlatform(platform.key)
                    }>
                    {isLinked ? "Manage" : "Connect"}
                  </Button>
                ) : null}
              </div>

              <div
                className={cn(
                  "mt-3",
                  isDropdown && "mt-2",
                )}>
                {isLinked ? (
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      isDropdown && "gap-1.5",
                    )}>
                    {platformAccounts.map((account) => {
                      const content = (
                        <span className="truncate">
                          @{account.accountName}
                        </span>
                      );

                      if (onAccountClick) {
                        return (
                          <button
                            key={account._id}
                            type="button"
                            onClick={() =>
                              onAccountClick(
                                platform.key,
                                account,
                              )
                            }
                            className={cn(
                              "inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted",
                              isDropdown && "px-2.5 py-0.5",
                            )}>
                            {content}
                          </button>
                        );
                      }

                      return (
                        <span
                          key={account._id}
                          className={cn(
                            "inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-foreground",
                            isDropdown && "px-2.5 py-0.5",
                          )}>
                          {content}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    This platform is not linked yet.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({
  linked,
  count,
}: {
  linked: boolean;
  count: number;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        linked
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}>
      {linked ? `${count} linked` : "Unlinked"}
    </span>
  );
}

function countLinked(
  accounts?: LinkedAccountsByPlatform | null,
) {
  return PLATFORMS.reduce(
    (total, platform) =>
      total + (accounts?.[platform.key]?.length ?? 0),
    0,
  );
}
