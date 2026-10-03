import { Moon, Sun, Ticket } from "lucide-react";
import { useState } from "react";
import { DsBadge } from "@/components/ui/badge";
import { DsButton } from "@/components/ui/button";
import { Dialog, DsDialogContent } from "@/components/ui/dialog";
import { DsInput } from "@/components/ui/input";
import { DsSkeleton } from "@/components/ui/skeleton";

const colors = [
  ["Cream (bg)", "var(--ev-bg)"],
  ["Surface", "var(--ev-surface)"],
  ["Raised", "var(--ev-bg-raised)"],
  ["Burgundy", "var(--ev-accent)"],
  ["Burgundy hover", "var(--ev-accent-hover)"],
  ["Dusty Pink", "var(--ev-pink)"],
  ["Pink wash", "var(--ev-pink-wash)"],
  ["Text", "var(--ev-text)"],
  ["Text muted", "var(--ev-text-muted)"],
  ["Border", "var(--ev-border)"],
  ["Success", "var(--ev-success)"],
  ["Warning", "var(--ev-warning)"],
  ["Danger", "var(--ev-danger)"],
] as const;

export function DesignSystemGallery() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  return (
    <main className="design-system" data-theme={theme}>
      <div className="ds-gallery__shell">
        <header className="ds-gallery__header">
          <div>
            <p className="ds-gallery__eyebrow">Eventix · Design Tokens</p>
            <h1>Design system</h1>
            <p className="ds-gallery__intro">Burgundy accent, cream foundation, dusty-pink soft tints. 60/30/10 — all pairs WCAG AA or better.</p>
          </div>
          <DsButton className="ds-gallery__theme" variant="secondary" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            {theme === "dark" ? "Light preview" : "Dark preview"}
          </DsButton>
        </header>

        <div className="ds-gallery__grid">
          <section className="ds-section ds-section--full" aria-labelledby="color-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">01 · Color</p><h2 id="color-title">Burgundy #722F37 · Cream #F8F4E7 · Dusty Pink #D7A7B1</h2><p className="ds-section__description">Burgundy is the sole accent — CTAs, selected states, focus rings. Pink appears only as soft tints. No other brand colors.</p></div>
            <div className="ds-token-grid">{colors.map(([label, value]) => <div className="ds-color-token" key={label}><div className="ds-color-token__swatch" style={{ "--token": value } as React.CSSProperties} /><span className="ds-color-token__label">{label}</span></div>)}</div>
          </section>

          <section className="ds-section" aria-labelledby="type-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">02 · Type</p><h2 id="type-title">Editorial hierarchy, utility detail</h2></div>
            <div className="ds-type-sample"><span>Display / 60</span><div className="ds-type-sample__display">Make plans.</div><span>Title / 24</span><div className="ds-type-sample__title">A better night out starts here.</div><span>Body / 16</span><p className="ds-type-sample__body">Clear information earns trust. Titles, dates, venues, and prices are always easy to scan.</p><span>Meta / 12</span><p className="ds-type-sample__meta">₹ 1,250 · 07:30 PM · TKT-EX24</p></div>
          </section>

          <section className="ds-section" aria-labelledby="action-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">03 · Actions</p><h2 id="action-title">Purposeful controls</h2></div>
            <div className="ds-stack"><DsButton>Continue booking</DsButton><DsButton variant="secondary">View details</DsButton><DsButton variant="ghost">Save for later</DsButton><DsButton variant="destructive">Cancel booking</DsButton><DsButton loading>Processing</DsButton></div>
          </section>

          <section className="ds-section" aria-labelledby="form-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">04 · Forms</p><h2 id="form-title">Direct, labelled, helpful</h2></div>
            <DsInput id="gallery-email" label="Email address" type="email" placeholder="you@example.com" hint="We only use this to send your booking confirmation." />
          </section>

          <section className="ds-section" aria-labelledby="state-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">05 · States</p><h2 id="state-title">Semantic feedback</h2></div>
            <div className="ds-stack"><DsBadge tone="neutral">Standard</DsBadge><DsBadge tone="accent">Selected</DsBadge><DsBadge tone="success">Confirmed</DsBadge><DsBadge tone="warning">Pending</DsBadge><DsBadge tone="danger">Cancelled</DsBadge></div>
          </section>

          <section className="ds-section ds-section--full" aria-labelledby="composition-title">
            <div className="ds-section__head"><p className="ds-section__eyebrow">06 · Composition</p><h2 id="composition-title">Cards, loading, and dialogs</h2></div>
            <div className="ds-gallery__grid"><article className="ds-preview-card"><div className="ds-poster-placeholder" aria-hidden="true" /><div><DsBadge tone="accent">Live music</DsBadge><h3>Midnight at the Museum</h3><p>Saturday · 7:30 PM · Mumbai</p><DsButton size="sm"><Ticket size={15} aria-hidden="true" /> View showtimes</DsButton></div></article><div><DsSkeleton className="ds-skeleton--title" /><DsSkeleton className="ds-skeleton--body" /><DsSkeleton className="ds-skeleton--body" /></div><Dialog.Root><Dialog.Trigger asChild><DsButton variant="secondary">Open dialog</DsButton></Dialog.Trigger><DsDialogContent><Dialog.Title asChild><h2>Cancel this booking?</h2></Dialog.Title><Dialog.Description asChild><p className="ds-section__description">This action is clear, reversible only when the backend confirms it, and keeps keyboard focus inside the dialog.</p></Dialog.Description><div className="ds-stack"><Dialog.Close asChild><DsButton variant="secondary">Keep booking</DsButton></Dialog.Close><DsButton variant="destructive">Cancel booking</DsButton></div></DsDialogContent></Dialog.Root></div>
          </section>
        </div>
      </div>
    </main>
  );
}
