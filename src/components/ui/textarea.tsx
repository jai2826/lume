import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-3 text-[0.8125rem] text-foreground leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-muted/40 focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-input dark:focus-visible:bg-input/35",
        className,
      )}
      {...props}
    />
  );
}
