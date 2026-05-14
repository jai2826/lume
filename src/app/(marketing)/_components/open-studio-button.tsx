"use client";

import Link from "next/link";

const OpenStudioButton = () => {
  return (
    <Link
      href="/activestudios"
      className="inline-flex min-h-[4rem] items-center justify-center rounded-full border border-border bg-background/90 px-10 text-[1.1rem] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground">
      Open studio
    </Link>
  );
};

export default OpenStudioButton;
