# Eventix Design System

**Phase:** 1 — design system and information architecture  
**Status:** ready for review  
**Scope:** tokens, core primitives, route plan, and page structures. The existing production UI remains in place until Phase 2 migrates each page.

## Product character

Eventix is a calm, editorial ticketing service. Posters, titles, showtimes, venues, and price carry the visual interest. The interface is clear at a glance and remains quiet around that content.

- Use a graphite neutral system for the application surface.
- Use crimson only for the primary action, selected state, and focus treatment.
- Use green, ochre, and red only to communicate booking state.
- Use borders and restrained shadows for elevation. Do not use decorative gradients on interface surfaces.
- Prefer a short, precise label over a clever label.

## Foundations

### Color tokens

| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--ds-ink` | `#121212` | `#f7f7f4` | Application background |
| `--ds-surface` | `#1b1b1b` | `#ffffff` | Cards and panels |
| `--ds-surface-raised` | `#242424` | `#f8f8f5` | Inputs and nested surfaces |
| `--ds-line` | `#3a3a3a` | `#deded8` | Default borders |
| `--ds-text` | `#f5f5f3` | `#20201e` | Primary copy |
| `--ds-text-muted` | `#b5b5b1` | `#5e5e58` | Supporting copy |
| `--ds-accent` | `#d54b57` | `#b63444` | Primary action, selection, focus |
| `--ds-success` | `#4da97b` | same | Confirmed states only |
| `--ds-warning` | `#d08a37` | same | Pending states only |
| `--ds-danger` | `#d85757` | same | Errors and cancellation only |

All components consume semantic tokens. Components must never embed a raw color value.

### Type

The planned family is **Geist Sans**, self-hosted before Phase 2 to avoid render-blocking font requests. System sans is the Phase 1 fallback. Geist Mono is reserved for ticket codes, seat codes, dates and prices where aligned figures improve scanning.

| Role | Size / line-height | Weight | Use |
|---|---|---|---|
| Display | 48–72 / 0.98 | 700 | Landing hero only |
| H1 | 40–48 / 1.04 | 700 | Page title |
| H2 | 24–32 / 1.12 | 650 | Section title |
| H3 | 18–20 / 1.25 | 650 | Card title and grouped control label |
| Body | 16 / 1.6 | 400 | Descriptions and form copy |
| UI | 14 / 1.35 | 600 | Buttons, filters, metadata labels |
| Meta | 12 / 1.35 | 500 | Ticket ID, timestamp, price details |

### Spacing, shape, and elevation

- Spacing uses the 4 px grid: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- Control radius: 10 px. Card radius: 14 px. Panel radius: 20 px. Pills use `999px`.
- Controls are at least 44 px tall. Icon controls are 44 × 44 px.
- Cards use a one-pixel border before a subtle shadow. Do not add glows.

### Motion

| Token | Value | Use |
|---|---:|---|
| `--ds-duration-fast` | 150 ms | Press, hover, focus |
| `--ds-duration-base` | 250 ms | Dialogs, tabs, list entry |
| `--ds-duration-slow` | 500 ms | Page and story transitions |
| `--ds-ease-standard` | `cubic-bezier(.2,0,0,1)` | Most transitions |
| `--ds-ease-emphasized` | `cubic-bezier(.2,.8,.2,1)` | Page-level emphasis |
| `--ds-ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Small confirmation feedback |

Motion may animate opacity and transform. The global reduced-motion rule removes nonessential animation. GSAP and Lenis are deferred to the landing-page work in Phase 2 so they do not add an unused initial bundle.

## Core component inventory

Phase 1 introduces owned, accessible primitives under `frontend/src/components/ui/`:

| Component | Phase 1 behavior | Phase 2 use |
|---|---|---|
| `DsButton` | Primary, secondary, ghost, destructive; sizes; loading state | CTAs, dialogs, forms |
| `DsInput` | Explicit label, hint or error description, invalid state | Auth, search, admin forms |
| `DsBadge` | Neutral, accent, success, warning, danger | Show category and booking status |
| `DsDialogContent` | Radix focus management, overlay, escape and close control | Cancellation and admin confirmations |
| `DsSkeleton` | Content-shaped loading surface | Catalog, detail, booking loading |

The next additions when a real page needs them are select/combobox, tabs, chips, stepper, sheet/drawer, toast, tooltip, pagination, poster card, order summary, seat map, ticket, and data table. They will be introduced with their first real use, with no unused gallery-only API.

## Planned information architecture

### Routing and access

| Route | Access | Data capability | Page purpose |
|---|---|---|---|
| `/` | Public | Shows, movies, events | Cinematic landing and discovery entry |
| `/explore` | Public | All catalog data client-side | Filterable browse page with URL state |
| `/explore/:category` | Public | Client-side category filter | Movies or live experiences listing |
| `/search` | Public | Client-side full catalog search | Dedicated shareable search results |
| `/shows/:id` | Public | Show, catalog item, inventory | Detail and booking entry |
| `/shows/:id/seats` | Public, login at continue | Inventory | Quantity and seat selection |
| `/venues` | Public | Venue list | Venue directory |
| `/venues/:id` | Public | Venue list, client-side lookup | Venue detail and related shows |
| `/checkout` | Customer | Booking draft | Review and sandbox payment |
| `/confirmation/:id` | Customer | Booking | Ticket, calendar and download tools |
| `/bookings` | Customer | Own bookings | Upcoming, past and cancelled list |
| `/bookings/:id` | Customer | Own booking | Full ticket detail |
| `/profile` | Customer | Auth session | Read-only account overview |
| `/login`, `/register` | Public | Auth service | Session entry with return URL |
| `/admin` | Admin | Catalog, own bookings | Overview and capability guide |
| `/admin/shows` | Admin | Shows | Publishable shows table; clear API limitation notice |
| `/admin/shows/new` | Admin | Create show | Validated create-show form |
| `/admin/bookings` | Admin | Own bookings only | Explicitly limited bookings list |
| `/_design` | Development only | None | Design-system gallery |

`/profile/settings`, password reset routes, show edit/delete routes, and all-user admin bookings are intentionally absent. Their backend support does not exist. Current legacy routes will redirect to the canonical Phase 2 equivalents when those views land.

### Route protection

The Vite SPA continues to use route wrappers. Protected routes preserve the full path and query string in the `next` parameter; an authenticated user entering `/login` or `/register` returns to the requested destination. Admin wrappers require the `ADMIN` role and redirect unauthorized users home. Phase 2 will validate a persisted token with `GET /api/auth/me` at session hydration and centralize 401 handling.

## Page structures

| Page | Wireframe-level structure | Primary action and states |
|---|---|---|
| Landing | Full-bleed hero with search; featured poster rail; category tiles; how-it-works; trust statements; date-grouped upcoming list; structured footer | Explore or search. Each catalog chapter has shaped loading, empty, and retry treatment. |
| Explore | Page title; sticky filter bar; result count and grid/list switch; result grid; pagination | Filter and sort update URL. Empty state clears filters. |
| Search | Search input with keyboard shortcut hint; result summary; grouped result list | Submit URL-backed query; empty and error state explain recovery. |
| Show detail | Poster/banner hero; title and metadata; venue; description; schedule; related shows; sticky booking bar | Choose showtime or seats. Inventory errors retain page content and offer retry. |
| Seat selection | Back link; show facts; accessible quantity/seat control; live order summary | Continue asks for login only when checkout starts. Sold-out state disables continue with clear explanation. |
| Checkout | Three-step header; order review; customer details; clearly-labelled sandbox payment; final total | Submit once; payment failure and availability conflict retain a recoverable draft. |
| Confirmation | Success heading; scannable ticket; booking facts; calendar/download actions | Calendar and ticket file actions are client-side utilities. |
| Bookings | Tab controls for upcoming, past, cancelled; ticket-card list; cancellation dialog | Cancel only on eligible bookings; refetch after success. |
| Booking detail | Ticket hero; event facts; payment and status panel; calendar/download actions | Cancel when supported by booking status. |
| Profile | Identity card; account facts; booking shortcut; theme preference | No profile edit action because the API is read-only. |
| Login/register | Centered form panel; contextual return copy; form validation; show/hide password | Submit, field errors, API error, and loading state. |
| Admin overview | Sidebar; compact catalog stats; quick actions; capability notice | Navigate to a supported catalog action. |
| Admin shows | Table controls; show rows; create-show CTA; API limitation callout | Create only. Edit/delete controls are omitted. |
| Admin create show | Stepwise, validated catalog and schedule form; availability guidance | Publish show through the existing create endpoint. |
| Admin bookings | Explicit “your bookings” label; status filter; booking list | Shows only the admin user’s own bookings. |
| Venue directory/detail | Directory filters; venue name/address; related-show grid | Navigation to matching show details. |
| System states | 404, error boundary, offline notice, shaped loading skeletons | Always provide a useful return link or retry action. |

## Accessibility rules

- Every interactive control has a visible keyboard focus ring using the accent token.
- Forms use programmatic labels, errors use `aria-invalid` and `aria-describedby`, and status feedback uses appropriate live regions.
- Dialogs use Radix to restore focus and trap it while open.
- Poster imagery has meaningful alternative text; decorative artwork is hidden from assistive technology.
- Status is never conveyed with color alone.
- Body text and controls target WCAG 2.2 AA contrast in both themes.

## Gallery and implementation notes

Run `npm run dev` in `frontend/`, then open `http://localhost:3000/_design`. The route is guarded with `import.meta.env.DEV`, so production serves the normal 404 for that path.

The token layer is intentionally namespaced (`--ds-*`) while the legacy stylesheet remains active. Phase 2 will migrate route by route, then remove the legacy stylesheet and its old global tokens once no page depends on them.
