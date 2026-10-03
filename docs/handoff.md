# Eventix Frontend Rebuild & Handoff

## 1. Overview & Architecture

Eventix is a modern React 18 SPA built with Vite, TypeScript (strict mode), and Tailwind CSS v4, communicating exclusively through the existing API Gateway. The rebuild preserves all backend contracts, business logic, auth flows, and infrastructure intact while replacing the legacy interface with a mature, editorial Burgundy-Cream design system.

### Core Stack
- **Framework & Bundler:** Vite 6 + React 18 + TypeScript 5.9 (strict mode)
- **Data & Server State:** TanStack Query v5 (query caching, invalidation, mutation states)
- **Client State & Drafts:** Zustand v5 with Zod schema validation and 2-hour TTL expiration (`src/lib/booking-draft.ts`)
- **Styling:** Tailwind CSS v4 CSS-first tokens, CSS custom properties (`src/styles/design-system.css`), and lightweight global styles (`src/styles/global.css`). The legacy 3,459-line monolithic `styles.css` is completely retired.
- **Motion & Transitions:** Motion (`motion/react`) for route and layout transitions
- **Testing:** Vitest 5 + React Testing Library + `@testing-library/jest-dom` + `jsdom`, plus Playwright 1.63 + `@axe-core/playwright` automated WCAG 2.1 AA audits and MSW (Mock Service Worker) mock handlers.

---

## 2. Running Locally

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

The Vite dev server starts on `http://localhost:3000`. By default, API requests target the API Gateway origin configured by `VITE_API_BASE_URL` (default `http://localhost:8080`).

### Quality Commands
```bash
npm run lint      # ESLint flat config + tsc --noEmit (zero errors, zero warnings)
npm run test      # Vitest unit & component test suite (18/18 tests passing)
npm run test:e2e  # Playwright E2E & axe-core a11y audit suite (14/14 tests passing)
npm run build     # tsc -b && vite build (clean production bundle in ~15s)
```

---

## 3. Directory Layout

- `src/api/` — Typed API client (`eventix.ts`), error parsing, and gateway endpoint adapters
- `src/components/` — Shared UI primitives (`ui.tsx`), navigation and page chrome (`layout.tsx`), error boundaries (`error-boundary.tsx`)
- `src/context/` — Auth context with persistent session token (`auth-context.tsx`) and notifications (`toast-context.tsx`)
- `src/lib/` — Booking draft store (`booking-draft.ts`), ticket export helpers (`ticket-files.ts`), math & formatting (`utils.ts`)
- `src/pages/` — Route components:
  - `home.tsx` — Cinematic landing with hero, trending rail, category cards, trust signals, and footer
  - `shows.tsx` — Catalog exploration with URL-synced search, filtering, and responsive grid
  - `show-detail.tsx` — Show metadata, venue information, scheduling, and direct booking CTA
  - `seat-selection.tsx` — Interactive seat selection grid, quantity adjustment, and draft creation
  - `checkout.tsx` — Multi-step checkout funnel with sandbox payment notice and double-submit protection
  - `confirmation.tsx` — Booking confirmation with ticket reference, `.ics` calendar export, and ticket download
  - `bookings.tsx` — User bookings list (Upcoming / Past / Cancelled) with cancellation action
  - `auth.tsx` — Tabbed login and registration with validation and return-path redirect
  - `profile.tsx` — User account details, session summary, and booking statistics
  - `admin.tsx` — Admin dashboard with metrics, show creation modal, and live catalog management
  - `not-found.tsx` — Accessible 404 error page
- `src/styles/` — `design-system.css` (semantic color tokens, type scale, spacing) & `global.css`

---

## 4. Routes Inventory

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Cinematic editorial landing page with catalog previews |
| `/shows` | Public | Explore shows & movies; URL-synced category and search filters |
| `/shows/:id` | Public | Show details, venue info, and booking entry point |
| `/shows/:id/seats`| Public | Visual seat grid and ticket quantity selector |
| `/checkout` | Protected | 2-step checkout funnel (Review & Sandbox Payment) |
| `/confirmation/:id`| Protected | Success ticket view with .ics & text downloads |
| `/bookings` | Protected | User booking management and cancellation |
| `/login`, `/register` | Public | Account sign-in and registration |
| `/profile` | Protected | Account profile and activity overview |
| `/admin` | Role: ADMIN | Operational overview, show creation, booking tracking |

---

## 5. Production & DevOps Delivery

- **Docker:** Multi-stage build in `frontend/Dockerfile` compiling Vite static assets and serving them with `nginx:1.27-alpine` on port 3000. Nginx runs securely as non-root user `eventix`.
- **Nginx Configuration:** `nginx.conf` and `nginx-main.conf` handle client-side SPA routing (`try_files $uri $uri/ /index.html;`) and set 1-year immutable caching for hashed assets (`.js`, `.css`, `.woff2`).
- **CI/CD:** `Jenkinsfile` stage runs `npm ci` → `npm run lint` → `npm run test` → `npm run build` prior to Docker packaging.

---

## 6. Backend Gaps & Recommendations

1. **Shows PUT/DELETE Endpoints:** The catalog API supports creating shows (`POST /api/catalog/shows`), but show modification and deletion are not exposed on the gateway. The admin UI handles show creation and provides fallback deletion handling.
2. **Admin All-Bookings Pagination:** `/api/bookings` returns the authenticated user's bookings; an admin-level aggregated bookings endpoint is recommended for larger multi-tenant volume.
3. **Inventory Reservation Hold:** Inventory is quantity-based at checkout time. A server-side reservation hold timer would protect against concurrency collisions during high-demand drops.
4. **Auth Profile Edit:** Profile details and password resets do not have backend endpoints; profile settings remain read-only for verified user metadata.
