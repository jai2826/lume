"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const GetStartedButton = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  let dashboardLink = "";

  if (!isSignedIn) {
    dashboardLink = "/sign-in";
  } else if (isSignedIn && isLoaded) {
    const slug = user.publicMetadata
      .lastActiveStudioSlug as string;
    console.log(slug)
    if (slug === null || slug === undefined) {
      // const studios = useQuery(api.studios.getMyStudios)
      dashboardLink = "/activestudios";
    } else dashboardLink = `${slug}/dashboard/`;
  }

  return (
    <Link
      href={dashboardLink}
      className={cn(
        "group relative w-48 inline-flex min-h-16 items-center justify-center overflow-hidden rounded-full px-12 text-[1.1rem] font-semibold tracking-tight text-white transition-[transform,box-shadow,background-color] active:translate-y-px",
        "bg-brand shadow-glow hover:bg-brand-600",
      )}
      prefetch={false}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[-40%] top-[-60%] h-[160%] translate-y-full bg-linear-to-br from-transparent via-white/35 to-transparent opacity-65 blur-2xl transition-transform duration-700 group-hover:translate-y-[18%]"
      />
      <span className="relative">Get started</span>
    </Link>
  );
};

export default GetStartedButton;
