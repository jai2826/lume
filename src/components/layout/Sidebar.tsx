"use client";

import { StudioSwitcher } from "@/components/studio-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  Calendar,
  LayoutGrid,
  Link2,
  PenSquare,
  Settings,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { LumeLogo } from "../brand/logo"; // Adjust import path as needed

const NAV = [
  {
    group: "WORKSPACE",
    items: [
      {
        href: "dashboard",
        label: "Studio Dashboard",
        icon: LayoutGrid,
      },
      {
        href: "composer",
        label: "Shot Composer",
        icon: PenSquare,
        accent: true,
      },
      {
        href: "calendar",
        label: "Content Calendar",
        icon: Calendar,
      },
      {
        href: "analytics",
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    group: "SETUP",
    items: [
      {
        href: "connections",
        label: "Connection Review",
        icon: Link2,
      },
      {
        href: "settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { slug } = useParams();

  // 1. Hook straight into Clerk for real user data
  const { isLoaded, user } = useUser();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border/70 bg-sidebar h-screen sticky top-0">
      <div className="flex justify-between  items-center  py-6 px-5">
        <LumeLogo size={40} />
        {/* <p>Lume</p> */}
        <StudioSwitcher />
      </div>

      <nav className="flex-1 space-y-8 px-4 py-6 overflow-y-auto scrollbar-thin"></nav>

      {/* 2. Real User Profile Section */}
      <div className="m-4 flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-feather">
        {!isLoaded ? (
          // Show skeletons while Clerk is loading
          <div className="flex w-full items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-col flex gap-2 w-full">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <>
            {/* Clerk's invisible UserButton handles the click dropdown and sign out */}
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted shrink-0">
              <div className="absolute inset-0 z-10 opacity-0">
                <UserButton />
              </div>
              <img
                src={user?.imageUrl}
                alt={user?.fullName || "User"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-medium">
                {user?.fullName}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
