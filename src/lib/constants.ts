import { PlatformKey } from "@/lib/types";
import { ComponentType } from "react";
import {
  FaInstagram,
  FaSnapchat,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

export const PLATFORMS: Array<{
  key: PlatformKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    key: "instagram",
    label: "Instagram",
    icon: FaInstagram,
    accent: "from-purple-600 to-pink-600",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: FaYoutube,
    accent: "from-red-600 to-orange-500",
  },
  {
    key: "x",
    label: "X",
    icon: FaXTwitter,
    accent: "from-slate-900 to-slate-600",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: FaTiktok,
    accent: "from-black to-slate-700",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: FaSnapchat,
    accent: "from-yellow-400 to-yellow-300",
  },
];


