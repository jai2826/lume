"use client";

import { LumeLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserButton } from "@clerk/nextjs";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { Loader2Icon, User2 } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface MarketingNavbarProps {
  right?: ReactNode; // Optional extra actions to pass in from specific pages
}

export default function MarketingNavbar({
  right,
}: MarketingNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 py-4">
        <Link
          href="/"
          className="flex items-center gap-2">
          <LumeLogo />
        </Link>
        <div>
          <AuthLoading>
            <Loader2Icon
              className="animate-spin text-muted-foreground"
              size={20}
            />
          </AuthLoading>
          <Unauthenticated>
            <Tooltip>
              <TooltipTrigger
                render={(props) => {
                  return (
                    <Link href="/sign-up">
                      <Button
                        {...props}
                        variant={"outline"}>
                        <User2 size={20} />
                      </Button>
                    </Link>
                  );
                }}
              />
              <TooltipContent>
                <p>Sign up or log in to your account</p>
              </TooltipContent>
            </Tooltip>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
