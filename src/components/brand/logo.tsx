import { cn } from "@/lib/utils"; // Assuming you have Shadcn's standard cn utility

interface LumeLogoProps {
  size?: number;
  className?: string; // Always allow overriding classes for layout adjustments
}

export function LumeLogo({
  size = 32,
  className,
}: LumeLogoProps) {
  return (
    <div className={cn(className)}>
      <div
        className="relative grid place-items-center shadow-glow"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          background:
            "linear-gradient(135deg, #FF3D85, #FA0A61 55%, #C2084E)",
        }}>
        {/* Soft glass inner border */}
        <div className="absolute inset-[3px] rounded-[inherit] border border-white/30" />

        {/* Proportionally scaling center dot */}
        <div
          className="rounded-full bg-white/90 shadow-sm"
          style={{
            width: size * 0.25,
            height: size * 0.25,
          }}
        />
      </div>
    </div>
  );
}
