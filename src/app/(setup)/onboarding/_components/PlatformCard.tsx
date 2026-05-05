"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FaInstagram, FaSnapchat, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";


interface PlatformCardProps {
  platform: "instagram" | "youtube" | "x" | "tiktok"| "snapchat";
  isLinked: boolean;
  linkedAccounts: Array<{
    accountName: string;
    _id: string;
  }>;
  onAddAccount: () => void;
  isLoading?: boolean;
}

const platformConfig = {
  instagram: {
    name: "Instagram",
    icon: FaInstagram,
    color: "from-purple-600 to-pink-600",
  },
  youtube: {
    name: "YouTube",
    icon: FaYoutube,
    color: "from-red-600 to-orange-600",
  },
  x: {
    name: "X (Twitter)",
    icon: FaXTwitter ,
    color: "from-gray-800 to-gray-600",
  },
  tiktok: {
    name: "TikTok",
    icon: FaTiktok,
    color: "from-black to-gray-800",
  },
  snapchat: {
    name: "Snapchat",
    icon: FaSnapchat,
    color: "from-yellow-400 to-yellow-300",
  },
};

export function PlatformCard({
  platform,
  isLinked,
  linkedAccounts,
  onAddAccount,
  isLoading = false,
}: PlatformCardProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 transition-all hover:border-brand-accent/50",
        "flex flex-col items-center gap-4 text-center",
        "animate-in fade-in zoom-in duration-300"
      )}>
      {/* Platform Icon */}
      <div
        className={`bg-gradient-to-br ${config.color} rounded-lg p-3 text-white transition-transform hover:scale-110 duration-200`}>
        <Icon size={28} />
      </div>

      {/* Platform Name */}
      <h3 className="font-semibold text-sm text-foreground">
        {config.name}
      </h3>

      {/* Content - either linked accounts or add button */}
      {isLinked && linkedAccounts.length > 0 ? (
        <div className="w-full space-y-2">
          {/* Show linked accounts */}
          <div className="space-y-1">
            {linkedAccounts.map((account) => (
              <div
                key={account._id}
                className="text-xs text-muted-foreground py-1 px-2 bg-muted/20 rounded">
                @{account.accountName}
              </div>
            ))}
          </div>

          {/* Add Another button */}
          <Button
            onClick={onAddAccount}
            disabled={isLoading}
            className={cn(
              "w-full mt-3 px-3 py-2 rounded font-medium text-sm",
              "bg-brand-accent text-black transition-all",
              "hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            )}>
            {isLoading ? "Loading..." : "+ Add Another"}
          </Button>
        </div>
      ) : (
        /* Add Account button */
        <Button
          onClick={onAddAccount}
          disabled={isLoading}
          className={cn(
            "w-full px-4 py-2 rounded font-semibold text-sm text-black",
            "bg-primary transition-all duration-200",
            "hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}>
          {isLoading ? "Loading..." : "+ Add Account"}
        </Button>
      )}
    </div>
  );
}
