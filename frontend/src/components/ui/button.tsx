import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/class-names";

const buttonVariants = cva("ds-button", {
  variants: {
    variant: {
      primary: "ds-button--primary",
      secondary: "ds-button--secondary",
      ghost: "ds-button--ghost",
      destructive: "ds-button--destructive",
    },
    size: {
      sm: "ds-button--sm",
      md: "ds-button--md",
      lg: "ds-button--lg",
      icon: "ds-button--icon",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export const DsButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function DsButton(
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <LoaderCircle className="ds-button__loader" aria-hidden="true" />}
        {children}
      </Component>
    );
  },
);
