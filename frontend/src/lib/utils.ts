export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const dateOnly = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* Editorial poster fallbacks — obsidian gradients with a brass whisper.
   Single source of truth (was duplicated across five files). */
export const POSTER_FALLBACKS = [
  "linear-gradient(150deg, #6E2430, #2A1015 55%, #C9A96133)",
  "linear-gradient(150deg, #8A5A2B, #241812 55%, #C9A96133)",
  "linear-gradient(150deg, #5A2A52, #1D1219 55%, #C9A96133)",
  "linear-gradient(150deg, #2E4A34, #131C16 55%, #C9A96133)",
  "linear-gradient(150deg, #33404E, #141A21 55%, #C9A96133)",
  "linear-gradient(150deg, #7A4020, #221510 55%, #C9A96133)",
] as const;

export const posterFallback = (seed: number) =>
  POSTER_FALLBACKS[seed % POSTER_FALLBACKS.length];
