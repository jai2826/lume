"use client";

import { cn } from "@/lib/utils";

import { motion } from "framer-motion";
import { FaInstagram, FaSnapchat, FaTiktok, FaTwitter, FaX, FaYoutube } from "react-icons/fa6";


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
    icon: FaX,
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
    color: "from-black to-gray-800",
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border border-muted bg-card p-6 transition-all hover:border-brand-accent/50",
        "flex flex-col items-center gap-4 text-center",
      )}>
      {/* Platform Icon */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`bg-gradient-to-br ${config.color} rounded-lg p-3 text-white`}>
        <Icon size={28} />
      </motion.div>

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
                className="text-xs text-muted py-1 px-2 bg-muted/20 rounded">
                @{account.accountName}
              </div>
            ))}
          </div>

          {/* Add Another button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddAccount}
            disabled={isLoading}
            className={cn(
              "w-full mt-3 px-3 py-2 rounded font-medium text-sm",
              "bg-brand-accent text-black transition-all",
              "hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
            )}>
            {isLoading ? "Loading..." : "+ Add Another"}
          </motion.button>
        </div>
      ) : (
        /* Add Account button */
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddAccount}
          disabled={isLoading}
          className={cn(
            "w-full px-4 py-2 rounded font-semibold text-sm text-black",
            "bg-brand-accent transition-all duration-200",
            "hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}>
          {isLoading ? "Loading..." : "+ Add Account"}
        </motion.button>
      )}
    </motion.div>
  );
}
