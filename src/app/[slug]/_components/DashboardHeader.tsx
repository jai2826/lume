const DashboardHeader = ({
  tag,
  heading,
  description,
  CustomButtons,
}: {
  tag?: string;
  heading?: string;
  description?: string;
  CustomButtons?: React.ReactNode[];
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {tag && (
          <div className="inline-flex w-fit rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {tag}
          </div>
        )}
        {heading && (
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {heading}
          </h1>
        )}
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {CustomButtons && (
        <div className="flex flex-wrap items-center gap-2">
          {CustomButtons.map((Button, index) => (
            <div key={index}>{Button}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
