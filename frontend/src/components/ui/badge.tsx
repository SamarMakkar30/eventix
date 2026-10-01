import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/class-names";

const badgeVariants = cva("ds-badge", {
  variants: {
    tone: {
      neutral: "ds-badge--neutral",
      accent: "ds-badge--accent",
      success: "ds-badge--success",
      warning: "ds-badge--warning",
      danger: "ds-badge--danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function DsBadge({ className, tone, children }: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
