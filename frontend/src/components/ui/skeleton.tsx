import { cn } from "@/lib/class-names";

export function DsSkeleton({ className }: { className?: string }) {
  return <div className={cn("ds-skeleton", className)} aria-hidden="true" />;
}
