import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useDocumentMeta } from "../lib/use-document-meta";
import { Reveal } from "../components/motion-kit";

/* ── Shared legal-page shell ─────────────────────────────────────────── */
function LegalShell({
  title,
  updated,
  intro,
  sections,
  metaTitle,
  metaDesc,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
  metaTitle: string;
  metaDesc: string;
}) {
  useDocumentMeta(metaTitle, metaDesc);
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/" className="btn btn--ghost btn--sm" style={{ paddingLeft: "0.25rem" }}>
            <ChevronLeft size={16} aria-hidden="true" /> Home
          </Link>
        </div>
        <Reveal>
          <p className="section-head__eyebrow">Legal · Updated {updated}</p>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.05, margin: "0.5rem 0 1rem" }}>
            {title}
          </h1>
          <p style={{ color: "var(--ev-text-muted)", lineHeight: 1.75, marginBottom: "2.5rem" }}>{intro}</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sections.map(({ heading, body }, i) => (
            <Reveal key={heading} delay={Math.min(i * 0.04, 0.2)}>
              <section style={{ padding: "1.625rem 0", borderTop: "1px solid var(--ev-border)" }}>
                <h2 className="font-display" style={{ fontSize: "1.375rem", marginBottom: "0.75rem" }}>{heading}</h2>
                {body.map((p, j) => (
                  <p key={j} style={{ color: "var(--ev-text-muted)", lineHeight: 1.8, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>{p}</p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)", padding: "1.5rem 0 0", borderTop: "1px solid var(--ev-border)" }}>
            Questions about this policy? Email{" "}
            <a href="mailto:support@eventix.app" style={{ color: "var(--ev-gold)", textDecoration: "underline" }}>support@eventix.app</a>{" "}
            and we'll respond within a few working days.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

const UPDATED = "October 2026";

/* ── Privacy Policy ──────────────────────────────────────────────────── */
export function PrivacyPage() {
  return (
    <LegalShell
      metaTitle="Privacy Policy — Eventix"
      metaDesc="How Eventix collects, uses, and protects your personal information."
      title="Privacy Policy"
      updated={UPDATED}
      intro="We collect the minimum we need to run your account and your bookings, we never sell your data, and everything below is written in plain language."
      sections={[
        {
          heading: "What we collect",
          body: [
            "Account basics: your name, email address, and password (stored only as a salted hash).",
            "Booking records: shows you booked, quantities, amounts, and booking status.",
            "Technical essentials: a sign-in token kept in your browser's local storage so you stay logged in, plus your light/dark theme preference.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To authenticate you, show your bookings, process payments (simulated in this deployment), and send transactional emails such as booking confirmations and cancellation notices.",
            "We do not run advertising trackers, and we do not send marketing emails.",
          ],
        },
        {
          heading: "What we never do",
          body: [
            "We never sell or rent your personal information. We do not share it with third parties except the infrastructure needed to operate the service (hosting, database, email delivery).",
          ],
        },
        {
          heading: "Data retention & deletion",
          body: [
            "Your bookings are retained as long as your account exists so you can access your tickets. To request deletion of your account and personal data, email support@eventix.app from your registered address and we will process it within 30 days.",
          ],
        },
        {
          heading: "Security",
          body: [
            "Passwords are hashed, traffic between your browser and our services should always use HTTPS, and access tokens expire automatically. No system is perfect — if you believe your account was compromised, contact us immediately.",
          ],
        },
      ]}
    />
  );
}

/* ── Terms of Service ────────────────────────────────────────────────── */
export function TermsPage() {
  return (
    <LegalShell
      metaTitle="Terms of Service — Eventix"
      metaDesc="The terms that govern your use of the Eventix ticketing platform."
      title="Terms of Service"
      updated={UPDATED}
      intro="These terms cover the deal between you and Eventix when you browse, book, or attend. Short version: book honestly, tickets are personal, and in this deployment payments are simulated."
      sections={[
        {
          heading: "Using Eventix",
          body: [
            "You agree to provide accurate account information and to keep your credentials secret. One account per person, and you must be able to enter a valid contract under your local law.",
            "The service is provided for personal, non-commercial use. Don't scrape, overload, or attempt to break the platform.",
          ],
        },
        {
          heading: "Bookings & tickets",
          body: [
            "A booking is confirmed only when the platform shows a confirmed status with a booking reference. Seats are limited and held briefly during checkout — completing payment late can mean losing them.",
            "Tickets are personal and non-transferable unless stated otherwise. Your booking reference and a valid ID may be requested at the venue.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "This deployment runs a sandboxed payment gateway: no real money is charged, and every payment you make is a simulation for demonstration and testing purposes.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "Eventix is a ticketing channel. Event content, cancellations by organizers, and venue conditions are the responsibility of the event organizer. To the extent permitted by law, our liability is limited to the amount you paid through the platform.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We may update these terms; the 'updated' date above will change and material changes will be announced on the site. Continuing to use Eventix after a change means you accept the revised terms.",
          ],
        },
      ]}
    />
  );
}

/* ── Refund / Cancellation Policy ────────────────────────────────────── */
export function RefundsPage() {
  return (
    <LegalShell
      metaTitle="Refunds & Cancellations — Eventix"
      metaDesc="How to cancel an Eventix booking and how refunds work."
      title="Refunds & Cancellations"
      updated={UPDATED}
      intro="Plans change. Here's exactly how cancellations and refunds work — no fine print games."
      sections={[
        {
          heading: "Cancelling a booking",
          body: [
            "Open My Bookings, choose the booking, and press Cancel. Confirmed bookings for upcoming shows can be cancelled by you directly — no calls, no forms.",
            "Once cancelled, the seats are released immediately and the booking moves to a Cancelled state. Cancellation can't be undone, but you can always book again if seats remain.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "In this deployment payments are simulated, so refunds are too: the amount is returned to your original payment method instantly in the demo environment.",
            "In a production deployment, refunds are issued to the original payment method within 5–7 working days, depending on your bank.",
          ],
        },
        {
          heading: "Cancelled or rescheduled events",
          body: [
            "If an organizer cancels an event, every booker receives a full refund automatically. For rescheduled events, your booking carries over to the new date; if you can't make it, standard cancellation applies.",
          ],
        },
        {
          heading: "No-shows",
          body: [
            "Unused tickets for shows that have already taken place are not refundable.",
          ],
        },
      ]}
    />
  );
}

/* ── Cookie Policy ───────────────────────────────────────────────────── */
export function CookiesPage() {
  return (
    <LegalShell
      metaTitle="Cookie Policy — Eventix"
      metaDesc="The few cookies and local-storage keys Eventix uses, and why."
      title="Cookie Policy"
      updated={UPDATED}
      intro="Eventix is deliberately light on tracking: a handful of essential keys, zero advertising cookies."
      sections={[
        {
          heading: "What we store",
          body: [
            "eventix_token (local storage) — your sign-in session, so you don't log in on every page.",
            "eventix_user (local storage) — your name and email to render the interface without a round-trip.",
            "eventix_theme (local storage) — whether you prefer the dark or light marquee.",
            "eventix_booking_draft (session storage) — the show and seats you picked while completing checkout; it expires after two hours.",
            "eventix_cookie_consent (local storage) — your answer to the cookie banner, so we stop asking.",
          ],
        },
        {
          heading: "What we don't use",
          body: [
            "No advertising cookies, no cross-site trackers, no third-party analytics in this deployment.",
          ],
        },
        {
          heading: "Managing cookies",
          body: [
            "You can clear any of the above from your browser settings at any time. Clearing the session token signs you out; clearing the theme key returns you to your system default.",
          ],
        },
      ]}
    />
  );
}
