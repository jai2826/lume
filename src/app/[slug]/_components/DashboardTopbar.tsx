"use client";

import { LinkedStatus } from "@/app/[slug]/_components/LinkedStatus";
import { activeStudioAtom } from "@/atom/studioAtoms";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCachedStudioLinkedAccounts } from "@/hooks/useStudioCache";
import { useAtomValue } from "jotai";
import { LinkIcon, Plus } from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";
import { ReactNode } from "react";

interface TopBarProps {
  right?: ReactNode; // Optional extra actions to pass in from specific pages
}

export default function DashboardTopBar({
  right,
}: TopBarProps) {
  const router = useRouter();
  const activeStudio = useAtomValue(activeStudioAtom);
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.slug as string;
  const { accounts: linkedAccounts } =
    useCachedStudioLinkedAccounts(activeStudio?.studioId);

  const crumbs = pathname?.split("/").filter(Boolean) || [];

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-6">
        <div className=" flex items-center text-sm text-muted-foreground ">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="w-0.5 mr-2 data-[orientation=vertical]:h-4"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Breadcrumb>
            <BreadcrumbList className="text-xl">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                if (isLast) {
                  return (
                    <BreadcrumbItem key={index}>
                      <BreadcrumbPage className="font-semibold">
                        {crumb}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  );
                } else
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2">
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          render={
                            <Link href="#">{crumb}</Link>
                          }
                        />
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </div>
                  );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-4">
          {/* Global Search Trigger (Prepped for Command Palette) */}
          {/* <Button
            className="relative hidden lg:flex items-center h-11 w-80 rounded-full border border-black/5 bg-card px-4 text-base text-muted-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 shadow-sm"
            onClick={() =>
              console.log("TODO: Open Command Palette")
            }>
            <Search className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">
              Search everything...
            </span>
            <kbd className="pointer-events-none flex h-6 items-center gap-1.5 rounded bg-muted px-2 text-xs font-medium text-muted-foreground">
              <Command className="h-4 w-4" />K
            </kbd>
          </Button> */}

          {/* Any extra page-specific actions passed as props */}
          {right}

          {/* Primary Action */}
          <Button
            onClick={() => router.push(`/${slug}/composer`)}
            className=" rounded-lg bg-brand lg:p-5 p-4 text-base text-white hover:bg-brand/90 shadow-glow transition-all ease-in-out duration-200">
            <Plus className="mr-2 h-5 w-5" /> New Shot
          </Button>

          {/* Dropdown for links */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size={"icon"}
                  className="p-4 lg:p-5 rounded-full bg-brand text-base text-white hover:bg-brand/90 shadow-glow transition-all ease-in-out duration-200">
                  <LinkIcon />
                </Button>
              }
            />
            <DropdownMenuContent className={"w-full"}>
              <LinkedStatus
                variant="dropdown"
                className="p-0 max-h-none overflow-visible"
                title="Linked overview"
                description="A quick read on which accounts are already connected and which still need work."
                accounts={linkedAccounts}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
