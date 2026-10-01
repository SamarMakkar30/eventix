import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/class-names";

export { Dialog };

export function DsDialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="ds-dialog__overlay" />
      <Dialog.Content className={cn("ds-dialog__content", className)}>
        {children}
        <Dialog.Close className="ds-dialog__close" aria-label="Close dialog"><X size={18} /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
