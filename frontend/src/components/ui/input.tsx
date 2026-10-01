import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const DsInput = forwardRef<HTMLInputElement, InputProps>(function DsInput(
  { id, name, label, hint, error, className, ...props },
  ref,
) {
  const inputId = id ?? name;
  if (!inputId) {
    throw new Error("DsInput requires an id or name for an accessible label.");
  }
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="ds-field">
      <label className="ds-field__label" htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={cn("ds-input", error && "ds-input--error", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        {...props}
      />
      {error ? <p className="ds-field__error" id={descriptionId}>{error}</p> : null}
      {!error && hint ? <p className="ds-field__hint" id={descriptionId}>{hint}</p> : null}
    </div>
  );
});
