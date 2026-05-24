import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="rounded-2xl lg:flex-row lg:items-end lg:justify-between">
      <CardHeader className="space-y-2 w-full ">
        <CardTitle>
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
        </CardTitle>
        <CardDescription>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {CustomButtons && (
          <div className="flex flex-wrap items-center gap-2">
            {CustomButtons.map((Button, index) => (
              <div key={index}>{Button}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardHeader;
