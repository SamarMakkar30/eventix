# Eventix — Phase 0 Audit

> **Generated:** 2026-10-01  
> **Scope:** Complete read of `frontend/`, all backend service contracts via API gateway, Docker/K8s/CI, env handling.  
> **Rule:** NO code changes in this phase.

---

## 1. Current Architecture Overview

### Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Vite + React SPA | Vite 5.4, React 18.3 |
| Language | TypeScript (strict mode) | 5.9 |
| Routing | react-router-dom | 6.30 |
| Data fetching | @tanstack/react-query | 5.85 |
| Forms | react-hook-form + @hookform/resolvers + zod | RHF 7.62, Zod 4.1 |
| Animation | motion (Framer Motion successor) | 12.23 |
| Icons | lucide-react | 0.544 |
| CSS | Tailwind CSS 3.4 (configured but **barely used**) | 3.4.17 |
| Serving (prod) | `serve` (static file server) in Docker | 14.2.4 |

### File structure (flat, monolithic)

```
frontend/src/
├── api/
│   ├── client.ts          # fetch wrapper with error model + 401 event
│   └── eventix.ts         # typed API functions (all endpoints)
├── components/
│   ├── artwork.tsx         # poster/banner with fallback gradient
│   ├── error-boundary.tsx  # class-based error boundary
│   ├── layout.tsx          # navbar + footer + theme toggle + mobile menu
│   ├── seat-selector.tsx   # quantity stepper with visual seat grid
│   ├── show-card.tsx       # poster card used on home/shows
│   └── ui.tsx              # Button, Input, Select, Skeleton, StatusBadge,
│                           #   EmptyState, ErrorState, ConfirmDialog
├── context/
│   ├── auth-context.tsx    # AuthProvider (login/register/logout/token)
│   └── toast-context.tsx   # ToastProvider (success/error/info toasts)
├── lib/
│   ├── booking-draft.ts    # sessionStorage persistence for checkout draft
│   └── utils.ts            # cn(), money(), dateTime(), dateOnly(), initials(), posterGradient()
├── pages/
│   ├── admin.tsx           # 1,793 lines — ALL admin tabs in one file
│   ├── auth.tsx            # LoginPage + RegisterPage + AuthShell
│   ├── bookings.tsx        # user bookings list with cancel
│   ├── checkout.tsx        # order review + demo payment
│   ├── confirmation.tsx    # booking success with ticket card
│   ├── home.tsx            # landing page (hero + sections)
│   ├── not-found.tsx       # 404 page
│   ├── profile.tsx         # user profile overview
│   ├── seat-selection.tsx  # quantity picker + order summary
│   ├── show-detail.tsx     # show detail page
│   └── shows.tsx           # browse/filter/sort listing
├── types/
│   └── api.ts              # TypeScript interfaces for all API types
├── styles.css              # 3,459 lines — THE ENTIRE STYLESHEET
├── App.tsx                 # route definitions + Protected/AdminOnly guards
├── main.tsx                # entry point (providers)
└── vite-env.d.ts
```

---

## 2. Route Map (Current)

| Path | Component | Guard | Purpose |
|---|---|---|---|
| `/` | `HomePage` | Public | Landing page |
| `/shows` | `ShowsPage` | Public | Browse/filter/sort shows |
| `/shows/:id` | `ShowDetailPage` | Public | Show detail |
| `/shows/:id/seats` | `SeatSelectionPage` | Public (redirect to login at checkout) | Quantity selection |
| `/checkout` | `CheckoutPage` | `Protected` | Order review + payment |
| `/confirmation/:id` | `ConfirmationPage` | `Protected` | Booking success |
| `/bookings` | `BookingsPage` | `Protected` | User's bookings list |
| `/login` | `LoginPage` | Public (redirects if authed) | Login form |
| `/register` | `RegisterPage` | Public (redirects if authed) | Registration form |
| `/profile` | `ProfilePage` | `Protected` | User profile |
| `/admin` | `AdminPage` | `AdminOnly` | Admin CRUD (all tabs in one page) |
| `*` | `NotFoundPage` | Public | 404 |

**Route guard mechanism:** Wrapper components (`Protected`, `AdminOnly`) that read `useAuth()` context. No middleware — purely client-side redirect via `<Navigate>`. Return URL is passed via `?next=` query param on `/login`.

---

## 3. API Inventory (Typed)

All requests go through the API Gateway on port `8080`, which strips `/api` prefix and forwards to backend microservices.

### Auth Service (`/api/auth/*` → `auth-service:8081`)

| Method | Endpoint | Request Body | Response | Auth |
|---|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user: { id, name, email, role } }` | None |
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user: { id, name, email, role } }` | None |
| GET | `/api/auth/me` | — | `{ id, name, email, role }` | Bearer token |

### Catalog Service (`/api/catalog/*` → `catalog-service:8082`)

| Method | Endpoint | Request Body | Response | Auth |
|---|---|---|---|---|
| GET | `/api/catalog/shows` | — | `Show[]` | None |
| GET | `/api/catalog/shows/:id` | — | `Show` | None |
| POST | `/api/catalog/shows` | `{ showType, movieId, eventId, venueId, showDateTime, price, totalSeats }` | `Show` | Bearer (ADMIN) |
| GET | `/api/catalog/movies` | — | `Movie[]` | None |
| POST | `/api/catalog/movies` | `{ title, description, genre, language, durationMinutes, posterUrl, rating }` | `Movie` | Bearer (ADMIN) |
| PUT | `/api/catalog/movies/:id` | Same as POST | `Movie` | Bearer (ADMIN) |
| DELETE | `/api/catalog/movies/:id` | — | `204` | Bearer (ADMIN) |
| GET | `/api/catalog/events` | — | `Event[]` | None |
| POST | `/api/catalog/events` | `{ name, description, category, bannerUrl }` | `Event` | Bearer (ADMIN) |
| PUT | `/api/catalog/events/:id` | Same as POST | `Event` | Bearer (ADMIN) |
| DELETE | `/api/catalog/events/:id` | — | `204` | Bearer (ADMIN) |
| GET | `/api/catalog/venues` | — | `Venue[]` | None |
| POST | `/api/catalog/venues` | `{ name, address, city }` | `Venue` | Bearer (ADMIN) |

### Inventory Service (`/api/inventory/*` → `inventory-service:8083`)

| Method | Endpoint | Request Body | Response | Auth |
|---|---|---|---|---|
| GET | `/api/inventory/shows/:showId` | — | `{ showId, totalSeats, availableSeats }` | None |

### Booking Service (`/api/bookings/*` → `booking-service:8084`)

| Method | Endpoint | Request Body | Response | Auth |
|---|---|---|---|---|
| GET | `/api/bookings` | — | `Booking[]` (user's bookings) | Bearer |
| GET | `/api/bookings/:id` | — | `Booking` | Bearer |
| POST | `/api/bookings` | `{ showId, quantity, simulatePaymentFailure? }` | `Booking` | Bearer |
| POST | `/api/bookings/:id/cancel` | — | `Booking` | Bearer |

### Data Types (from `types/api.ts`)

```typescript
type Role = "CUSTOMER" | "ADMIN";
interface User { id: number; name: string; email: string; role: Role; }
interface AuthResponse { token: string; user: User; }
type ShowType = "MOVIE" | "EVENT";
interface Show {
  id: number; showType: ShowType; movieId: number | null;
  eventId: number | null; title: string; venueId: number;
  venueName: string; showDateTime: string; price: number;
  totalSeats: number;
}
interface Inventory { showId: number; totalSeats: number; availableSeats: number; }
type BookingStatus = "PENDING" | "CONFIRMED" | "PAYMENT_FAILED" | "CANCELLED";
interface Booking {
  id: number; showId: number; showTitle: string; venueName: string;
  showDateTime: string; quantity: number; pricePerTicket: number;
  totalAmount: number; status: BookingStatus; paymentId: number | null;
  createdAt: string;
}
interface Movie {
  id: number; title: string; description: string | null;
  genre: string | null; language: string | null;
  durationMinutes: number | null; posterUrl: string | null;
  rating: number | null;
}
interface Event {
  id: number; name: string; description: string | null;
  category: string | null; bannerUrl: string | null;
}
interface Venue {
  id: number; name: string; address: string | null; city: string | null;
}
```

---

## 4. Auth & Session Mechanism

- **JWT-based.** Backend issues a token on login/register.
- **Token storage:** `localStorage` key `eventix_token`. User object stored in `eventix_user`.
- **Auth header:** `Authorization: Bearer <token>` added by `api/client.ts`.
- **401 handling:** On 401 response, client dispatches `eventix:unauthorized` custom event → AuthProvider listens and calls `logout()` (clears localStorage, resets user state).
- **No token refresh.** No expiry detection. No `/api/auth/me` call on mount to validate stored token (the `api.me()` function exists but is never called).
- **Theme persistence:** `localStorage` key `eventix_theme` (dark/light), applied via `data-theme` attribute on `<html>`.

### Known auth issues

1. **Stale token risk:** If the JWT expires server-side, the user stays "logged in" until they make an API call that returns 401. No proactive validation on app load.
2. **No password reset flow.** No forgot-password endpoint exists in the backend.
3. **No profile edit.** The profile page is read-only — no endpoints for name/email/password change.
4. **Register always redirects to `/`.** It ignores any `?next=` param, unlike login which uses it.

---

## 5. What is Mocked vs Real

| Feature | Status |
|---|---|
| Auth (login/register) | **Real** — JWT from auth-service |
| Catalog CRUD (movies/events/venues/shows) | **Real** — PostgreSQL-backed |
| Inventory (available seats) | **Real** — inventory-service |
| Booking (create/list/cancel) | **Real** — booking-service |
| Payment | **Simulated** — backend payment-service processes sandbox transactions |
| Notifications | **Backend exists** but **no frontend integration** |
| Search | **Client-side only** — all data loaded, filtered in-browser |
| Cities/Locations | Venues have `city` field but **no city-based filtering** |
| Reviews/Ratings | Movie has admin-entered `rating` — **no user reviews** |
| Offers/Promotions | **None** — no backend support |
| Wishlist/Bookmarks | **None** — no backend support |

---

## 6. Known Bugs & Issues

### Functional

1. **`AnimatedCount` stale closure:** In `home.tsx`, the `useEffect` for AnimatedCount captures `displayValue` in closure but it's not in the dependency array. Animation may skip on subsequent value changes.

2. **Admin page uses `any` type:** `admin.tsx` lines 451 and 934 use `catch (err: any)` — the only `any` usage in the codebase.

3. **Seat selection page is not protected:** `/shows/:id/seats` is public. A user can select seats, then gets redirected to login. After login, they're sent back to `/shows/:id/seats` but the draft may not persist correctly.

4. **Booking draft has no expiry or schema validation:** `getBookingDraft()` trusts whatever is in sessionStorage via a raw `JSON.parse` cast. Corrupt or stale data can break checkout.

5. **No double-submit protection on checkout:** The `booking.mutate()` call has no idempotency key. Only guarded by `isPending` button disable.

6. **Filter state not synced to URL:** On `/shows`, only the `type` filter is URL-synced. Search query, venue, date, price, and sort are local state — lost on back/forward or page share.

7. **Admin page is a 1,793-line monolith:** All four tabs plus QuickPublish modal in a single file. No code splitting within admin.

8. **No admin bookings view:** Admin cannot see all bookings across users.

### Styling / UX

9. **3,459-line monolithic CSS:** `styles.css` is one file. Tailwind is installed but not actually used for styling.

10. **Tailwind is dead weight:** `tailwind.config.js` and `postcss.config.js` exist but contribute nothing. The entire UI is hand-written CSS with custom properties.

11. **Two font families loaded from Google CDN:** Manrope + DM Mono via `@import url()` — render-blocking, no `font-display` control, no subsetting.

12. **No favicon, no manifest, no OG images.**

13. **Footer is minimal:** Three links — no legal, no contact, no about.

### Performance

14. **All data loaded client-side:** Home page fetches all shows + movies + events. Shows page adds N individual inventory queries. No server-side pagination.

15. **No image optimization:** Raw `<img>` tags, no lazy loading, no responsive sizes, no AVIF/WebP, no blur-up placeholders.

16. **No code splitting beyond route-level lazy:** Admin page (58KB source) loads as one chunk.

---

## 7. Deployment Constraints

### Docker

- **Multi-stage build:** Stage 1 builds with Vite, Stage 2 serves with `serve@14.2.4`.
- **Port:** 3000 (exposed, mapped in docker-compose and K8s).
- **Build arg:** `VITE_API_BASE_URL` baked into JS bundle at build time.
- **User:** `node` (non-root).
- **Health check:** K8s probes hit `GET /` → `index.html` (200 from SPA fallback).

### Kubernetes

- **Deployment:** 1 replica, port 3000, NodePort 30300.
- **Probes:** readiness (10s/10s), liveness (20s/15s), both `GET / :3000`.
- **HPA:** CPU-based autoscaling.
- **Resources:** 100m–500m CPU, 128Mi–256Mi memory.

### CI (Jenkins)

- **Steps:** `npm ci` → `npm run lint` (`tsc --noEmit`) → `npm run build` → Docker build → Push → K8s deploy.
- **No e2e tests, no Lighthouse, no a11y checks.**

### Environment Variables

| Variable | Used In | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `api/client.ts` (build-time) | API Gateway URL. Default: `http://localhost:8080` |

---

## 8. Migration Plan

### Recommendation: **Stay on Vite — Do NOT migrate to Next.js**

#### Rationale

1. **The backend is a Java Spring Boot microservices architecture with an API gateway.** All data comes from REST APIs. No BFF, no SSR requirement. The API gateway handles CORS, routing, and auth.

2. **Next.js would add deployment complexity without proportional benefit:**
   - Server Components need a Node.js runtime in prod, replacing the current static-file Docker image (~40MB) with a much larger one.
   - K8s manifests, probes, and HPA would all need rework.
   - `VITE_API_BASE_URL` is baked at build time — Next.js would need different env var handling.
   - SSR/SSG for SEO has limited value on a ticketing platform where most pages are behind auth.

3. **Everything in the spec works on Vite + React SPA.** TanStack Query, Zustand, Motion, GSAP, Lenis, React Hook Form, Zod — all SPA-native.

4. **Deployment stays identical:** static `dist/`, same Docker image shape, same K8s probes, same Jenkins pipeline.

#### Plan

| Change | Deployment Impact |
|---|---|
| Upgrade Vite 5.4 → 6.x (latest stable) | None |
| Replace Tailwind CSS 3.4 with v4 (CSS-first config) | None |
| Add shadcn/ui + Radix primitives | None |
| Add GSAP, Lenis, Zustand, nuqs | None |
| Replace `serve` with nginx in Docker | Update Dockerfile only. Same port 3000. |
| Add path aliases (`@/`) | `vite.config.ts` + `tsconfig.app.json` only |
| Add Vitest, Playwright, ESLint flat config | Dev tooling only |

#### Proposed Dockerfile (Phase 2)

Replace `serve` with `nginx:alpine` for proper caching, compression, and SPA fallback:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

Port 3000 retained — K8s manifests untouched.

---

## 9. Backend Gaps & Unsupported Features

Features in the §6 IA spec with **no backend support.** Each row includes the confirmed product decision.

| Feature | Backend Status | Decision | Frontend Approach |
|---|---|---|---|
| **Full-text search** (server-side) | No endpoint | Accept | Client-side filtering on full dataset |
| **Pagination** | No endpoint supports it | Accept | Client-side pagination/infinite scroll |
| **Category pages** (`/explore/[category]`) | No filtering endpoint | Accept | Client-side filter via URL params |
| **Venue detail** (`/venues/:id`) | No single-venue endpoint | Accept | Filter from venues list client-side |
| **Forgot/reset password** | No endpoint | Hide | No "Forgot password?" link. No dead UI. |
| **Profile editing** | No PUT/PATCH on auth-service | Hide | Read-only profile. No fake edit buttons. |
| **Admin bookings view** (all users) | `/api/bookings` returns own only | **Accept limitation** | Show admin's own bookings only. Document gap. |
| **Reservation hold/expiry** | No hold mechanism | Accept | No timer. Race condition handled by backend 409. |
| **Notifications** | Service exists, no frontend API | **Ignore** | No notification bell. Use existing toasts for feedback. |
| **Add-to-calendar** | N/A — pure frontend | Build | Generate `.ics` client-side from booking data |
| **Download ticket** | No endpoint | Build | Client-side PDF/image generation from booking data |
| **Reviews/Ratings** (user-generated) | No endpoint | Hide | Show admin-entered `rating` field if present. No review form. |
| **Offers/Promotions** | No backend | Hide | No UI for this. |
| **Wishlist/Bookmarks** | No backend | Hide | No UI for this. |
| **Show update/delete** (admin) | No PUT/DELETE for shows | **Flag prominently** | Admin can create shows only. No fake Edit/Delete buttons. Admin UI shows clear notice: "Shows cannot be edited or deleted — this requires a backend enhancement (PUT/DELETE on `/api/catalog/shows/:id`)." |

### Backend enhancements needed for full feature parity (future work, NOT in scope)

1. **`PUT /api/catalog/shows/:id`** — Edit show details (datetime, price, venue, seats)
2. **`DELETE /api/catalog/shows/:id`** — Remove a published show
3. **`GET /api/bookings?admin=true`** — Admin endpoint returning all bookings across all users with pagination
4. **`PUT /api/auth/me`** or **`PATCH /api/auth/me`** — Update user profile (name, email)
5. **`POST /api/auth/forgot-password`** + **`POST /api/auth/reset-password`** — Password reset flow
6. **Server-side search/filter/pagination** on `/api/catalog/shows` — Query params for `type`, `venue`, `date`, `search`, `page`, `size`

---

## 10. Product Decisions (Confirmed)

All product questions have been resolved. These decisions are **final** and govern the rebuild:

### 1. Currency & Locale → **INR only**
- Use `₹` / `INR` and `en-IN` formatting throughout.
- `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` for all prices.
- No multi-currency support. No locale switcher.

### 2. Admin Bookings → **Show what the backend supports**
- The admin bookings tab shows the admin user's own bookings only (the backend limitation).
- No backend modification.
- The limitation is documented in §9 above with the specific endpoint enhancement needed.

### 3. Show Edit/Delete → **Flag as gap, no fake buttons**
- The admin UI will **only** expose "Create Show" — the one action the backend supports.
- No Edit or Delete buttons for shows. No dead UI.
- A clear notice in the admin Shows tab explains the limitation and what backend work is needed.

### 4. Notification Service → **Ignored**
- No notification bell, no notification provider, no integration with notification-service.
- Frontend uses its own toast system (success/error/info) for all user feedback.

### 5. Seed Data → **Create a local-dev seed script**
- A `scripts/seed-local.sh` (or `.py`) will be created in Phase 2 that:
  - Registers a test admin (`admin@test.com` / `admin123`) and a test customer
  - Creates 2–3 venues with realistic data
  - Creates 4–6 movies and 3–4 events with real Unsplash poster URLs
  - Publishes 6–10 shows with future dates and varied pricing
  - Uses only existing backend API contracts (no DB manipulation)
  - Is clearly marked as development-only, not shipped in production builds
- No fake/hardcoded data appears in the production frontend.

---

## 11. Summary: What Changes vs What Stays

### Sacred (untouched)

- All backend services (auth, catalog, inventory, booking, payment, notification)
- API contracts (endpoints, request/response shapes, auth headers)
- API Gateway configuration
- Database schemas
- Kubernetes manifests (except frontend image tag)
- Terraform/infrastructure
- Jenkins pipeline structure

### Disposable (completely rebuilt)

- All React components and pages
- `styles.css` (3,459 lines → deleted, replaced by Tailwind v4 + design tokens)
- Route structure (expanded per §6 IA)
- Component architecture (flat → feature-based folders)
- State management (Context → Zustand for client state)
- API client (add Zod validation, request cancellation, typed errors)
- Build tooling (add ESLint flat config, Vitest, Playwright, Lighthouse CI)

### Modified carefully

- `Dockerfile` (swap `serve` for `nginx`, retain port 3000 and non-root user)
- `package.json` (new dependencies, updated scripts)
- `tsconfig.app.json` (add path aliases, stricter settings)
- `vite.config.ts` (add aliases, plugins)
- `.env.example` (document any new env vars)

### New deliverables (added)

- `scripts/seed-local.py` — local development seed script
- `frontend/nginx.conf` — SPA-aware nginx config for production Docker image
