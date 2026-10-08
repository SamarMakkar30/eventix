import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronDown, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { Reveal } from "../components/motion-kit";

/* ══════════════════════════════════════════════════════════════════════════
   FAQ
   ══════════════════════════════════════════════════════════════════════════ */
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How do I book tickets?",
    a: "Browse the catalogue, open a show, and pick your seats directly on the seat map — click a seat to add it, click again to release it. Continue to checkout, confirm payment, and your ticket (with an EVX reference) is yours instantly.",
  },
  {
    q: "Are payments real?",
    a: "No. This deployment runs a sandboxed payment gateway — nothing is ever charged. You can even simulate a payment failure from the checkout screen to see how we handle it.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Open My Bookings and press Cancel on any confirmed booking for an upcoming show. Seats are released immediately and the refund (simulated here) returns to your original payment method.",
  },
  {
    q: "How many seats can I book at once?",
    a: "Up to 10 per booking. If availability drops while you're picking, your selection auto-adjusts so you can never checkout seats that just sold out.",
  },
  {
    q: "Where are my tickets stored?",
    a: "Every booking lives in My Bookings with its reference number, and you can download the ticket as a file or add the event to your calendar with one tap.",
  },
  {
    q: "Do you charge convenience fees?",
    a: "No. The price you see on a show is the price you pay — our order summary shows the convenience fee as Free, always.",
  },
  {
    q: "What if a show sells out?",
    a: "The show is marked Sold Out and booking is disabled. Availability updates live while you browse, so a show can only be booked while seats genuinely remain.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@eventix.app — we reply within a few working days. For account-deletion requests, email from your registered address.",
  },
];

export function FaqPage() {
  useDocumentMeta("FAQ — Eventix", "Answers to common questions about booking, payments, cancellations and tickets on Eventix.");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/" className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem" }}>
            <ChevronLeft size={16} aria-hidden="true" /> Home
          </Link>
        </div>
        <Reveal>
          <p className="section-head__eyebrow">Good to know</p>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.05, margin: "0.5rem 0 0.5rem" }}>
            Frequently asked <em>questions</em>
          </h1>
          <p style={{ color: "var(--ev-text-muted)", marginBottom: "2rem" }}>
            Everything customers usually ask before their first booking.
          </p>
        </Reveal>

        <div>
          {FAQS.map(({ q, a }, i) => (
            <Reveal key={q} delay={Math.min(i * 0.03, 0.15)}>
              <div style={{ borderTop: "1px solid var(--ev-border)" }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "1rem", padding: "1.25rem 0.25rem", background: "none", border: "none",
                    textAlign: "left", cursor: "pointer", color: "var(--ev-text)",
                    fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.01em",
                  }}
                >
                  {q}
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ color: "var(--ev-gold)", flexShrink: 0, display: "grid" }}
                  >
                    <ChevronDown size={18} aria-hidden="true" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.8, fontSize: "0.9375rem", padding: "0 0.25rem 1.375rem", maxWidth: "62ch" }}>
                        {a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="card gold-top" style={{ marginTop: "2.5rem", padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <MessageCircle size={22} style={{ color: "var(--ev-gold)" }} aria-hidden="true" />
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ fontWeight: 650, marginBottom: "0.25rem" }}>Still stuck?</div>
              <p style={{ fontSize: "0.9rem", color: "var(--ev-text-muted)" }}>
                Write to <a href="mailto:support@eventix.app" style={{ color: "var(--ev-gold)", textDecoration: "underline" }}>support@eventix.app</a> — a real human replies.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ABOUT
   ══════════════════════════════════════════════════════════════════════════ */
export function AboutPage() {
  useDocumentMeta("About — Eventix", "Why Eventix exists and how the platform is built.");
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/" className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem" }}>
            <ChevronLeft size={16} aria-hidden="true" /> Home
          </Link>
        </div>
        <Reveal>
          <p className="section-head__eyebrow">The house</p>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.05, margin: "0.5rem 0 1.25rem" }}>
            Built for the <em>night out</em>
          </h1>
        </Reveal>
        <Reveal delay={0.05}>
          <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.85, fontSize: "1.0625rem", marginBottom: "1.5rem" }}>
            Eventix started with a simple irritation: buying a ticket should feel like the start
            of a great night, not a form submission. So we built the box office we wanted to use —
            an editorial marquee instead of a grid of ads, a seat map you actually pick from,
            and a checkout with no surprise fees.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", margin: "2rem 0" }}>
            {[
              { n: "01", t: "Honest inventory", d: "Availability you see is availability that exists — live-updating, never oversold." },
              { n: "02", t: "Seats, not slots", d: "You choose where you sit. The map is yours; the math is ours." },
              { n: "03", t: "Zero fee theatre", d: "The price on the poster is the price at checkout. Convenience fee: free, forever." },
              { n: "04", t: "Cancel like an adult", d: "Plans change. One tap releases your seats — no phone calls, no guilt trips." },
            ].map(({ n, t, d }) => (
              <div key={n} className="card" style={{ padding: "1.25rem" }}>
                <div className="mono-ref" style={{ color: "var(--ev-gold)", marginBottom: "0.5rem" }}>{n}</div>
                <div style={{ fontWeight: 650, marginBottom: "0.375rem" }}>{t}</div>
                <p style={{ fontSize: "0.875rem", color: "var(--ev-text-muted)", lineHeight: 1.65 }}>{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.85, marginBottom: "2rem" }}>
            Under the marquee: a microservices backend (auth, catalogue, inventory, bookings,
            payments, notifications) behind an API gateway, and a motion-first React frontend
            designed around a three-voice type system — a serif for the cinema, a grotesque for
            the interface, a mono for the ticket stub.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/shows" className="btn btn--primary btn-shine">See what's on <ArrowRight size={16} aria-hidden="true" /></Link>
            <a href="mailto:support@eventix.app" className="btn btn--secondary" style={{ textDecoration: "none" }}>
              <Mail size={16} aria-hidden="true" /> Talk to us
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
