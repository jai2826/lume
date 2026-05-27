import { PLATFORMS } from "@/lib/constants";

export default function PostPage({
  searchParams,
}: {
  searchParams?: {
    shotId?: string;
    platform?: string;
  };
}) {
  const platform = PLATFORMS.find(
    (entry) => entry.key === searchParams?.platform,
  );

  return (
    <div className="p-8 md:p-12">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Post
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Create and manage your posts here.
          </h1>
          <p className="text-muted-foreground">
            {platform
              ? `Prepare the ${platform.label} version of this shot.`
              : "Select a platform from a shot to start posting."}
          </p>
        </div>

        {searchParams?.shotId ? (
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
            Shot ID: {searchParams.shotId}
            {platform ? ` · Platform: ${platform.label}` : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}
