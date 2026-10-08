import { http, HttpResponse } from "msw";

const BASE = process.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// ── Seed data ──────────────────────────────────────────────────────────────
const MOVIE: import("../types/api").Movie = {
  id: 1,
  title: "Inception",
  description: "A mind-bending thriller by Christopher Nolan.",
  genre: "Sci-Fi",
  language: "English",
  durationMinutes: 148,
  posterUrl: null,
  rating: 8.8,
};

const EVENT: import("../types/api").Event = {
  id: 1,
  name: "Arijit Singh Live",
  description: "A night to remember.",
  category: "Music",
  bannerUrl: null,
};

const VENUE: import("../types/api").Venue = {
  id: 1,
  name: "PVR Cinemas",
  address: "Connaught Place",
  city: "Delhi",
};

const SHOW: import("../types/api").Show = {
  id: 101,
  showType: "MOVIE",
  movieId: 1,
  eventId: null,
  title: "Inception",
  venueId: 1,
  venueName: "PVR Cinemas",
  showDateTime: "2026-12-31T19:30:00Z",
  price: 450,
  totalSeats: 120,
};

const BOOKING: import("../types/api").Booking = {
  id: 9001,
  showId: 101,
  showTitle: "Inception",
  venueName: "PVR Cinemas",
  showDateTime: "2026-12-31T19:30:00Z",
  quantity: 2,
  pricePerTicket: 450,
  totalAmount: 900,
  status: "CONFIRMED",
  paymentId: 1234,
  createdAt: "2026-10-01T10:00:00Z",
};

export const mockShows: import("../types/api").Show[] = [SHOW];
export const mockMovies: import("../types/api").Movie[] = [MOVIE];
export const mockEvents: import("../types/api").Event[] = [EVENT];
export const mockVenues: import("../types/api").Venue[] = [VENUE];

export const handlers = [
  // Auth
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "test@eventix.com" && body.password === "password123") {
      return HttpResponse.json({
        token: "mock-jwt-token",
        user: { id: 1, name: "Test User", email: body.email, role: "CUSTOMER" },
      });
    }
    if (body.email === "admin@eventix.com" && body.password === "admin123") {
      return HttpResponse.json({
        token: "mock-admin-token",
        user: { id: 2, name: "Admin User", email: body.email, role: "ADMIN" },
      });
    }
    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),

  http.post(`${BASE}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };
    return HttpResponse.json({
      token: "mock-new-jwt-token",
      user: { id: 99, name: body.name, email: body.email, role: "CUSTOMER" },
    });
  }),

  http.get(`${BASE}/api/auth/me`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth?.includes("mock")) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (auth.includes("admin")) {
      return HttpResponse.json({ id: 2, name: "Admin User", email: "admin@eventix.com", role: "ADMIN" });
    }
    return HttpResponse.json({ id: 1, name: "Test User", email: "test@eventix.com", role: "CUSTOMER" });
  }),

  // Catalog
  http.get(`${BASE}/api/catalog/shows`, () =>
    HttpResponse.json(mockShows),
  ),

  http.get(`${BASE}/api/catalog/shows/:id`, ({ params }) => {
    const s = mockShows.find((x) => x.id === Number(params.id));
    if (s) return HttpResponse.json(s);
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),

  http.post(`${BASE}/api/catalog/shows`, async ({ request }) => {
    const body = (await request.json()) as Partial<import("../types/api").Show>;
    const movie = mockMovies.find((m) => m.id === body.movieId);
    const event = mockEvents.find((e) => e.id === body.eventId);
    const venue = mockVenues.find((v) => v.id === body.venueId);
    const created: import("../types/api").Show = {
      id: Date.now(),
      showType: body.showType ?? "MOVIE",
      movieId: body.movieId ?? null,
      eventId: body.eventId ?? null,
      title: (body.showType === "MOVIE" ? movie?.title : event?.name) ?? "Untitled show",
      venueId: body.venueId ?? 1,
      venueName: venue?.name ?? "Main Auditorium",
      showDateTime: body.showDateTime ?? new Date().toISOString(),
      price: body.price ?? 250,
      totalSeats: body.totalSeats ?? 100,
    };
    mockShows.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${BASE}/api/catalog/shows/:id`, ({ params }) => {
    const idx = mockShows.findIndex((x) => x.id === Number(params.id));
    if (idx !== -1) mockShows.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/api/catalog/movies`, () => HttpResponse.json(mockMovies)),
  http.get(`${BASE}/api/catalog/movies/:id`, ({ params }) => {
    const m = mockMovies.find((x) => x.id === Number(params.id));
    if (m) return HttpResponse.json(m);
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),
  http.post(`${BASE}/api/catalog/movies`, async ({ request }) => {
    const body = (await request.json()) as Partial<import("../types/api").Movie>;
    const created: import("../types/api").Movie = {
      id: Date.now(),
      title: body.title ?? "New Movie",
      description: body.description ?? "",
      genre: body.genre ?? "Drama",
      language: body.language ?? "English",
      durationMinutes: body.durationMinutes ?? 120,
      posterUrl: body.posterUrl ?? null,
      rating: body.rating ?? 8.0,
    };
    mockMovies.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.delete(`${BASE}/api/catalog/movies/:id`, ({ params }) => {
    const idx = mockMovies.findIndex((x) => x.id === Number(params.id));
    if (idx !== -1) mockMovies.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/api/catalog/events`, () => HttpResponse.json(mockEvents)),
  http.get(`${BASE}/api/catalog/events/:id`, ({ params }) => {
    const e = mockEvents.find((x) => x.id === Number(params.id));
    if (e) return HttpResponse.json(e);
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),
  http.post(`${BASE}/api/catalog/events`, async ({ request }) => {
    const body = (await request.json()) as Partial<import("../types/api").Event>;
    const created: import("../types/api").Event = {
      id: Date.now(),
      name: body.name ?? "New Event",
      description: body.description ?? "",
      category: body.category ?? "Live",
      bannerUrl: body.bannerUrl ?? null,
    };
    mockEvents.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.delete(`${BASE}/api/catalog/events/:id`, ({ params }) => {
    const idx = mockEvents.findIndex((x) => x.id === Number(params.id));
    if (idx !== -1) mockEvents.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/api/catalog/venues`, () => HttpResponse.json(mockVenues)),
  http.post(`${BASE}/api/catalog/venues`, async ({ request }) => {
    const body = (await request.json()) as Partial<import("../types/api").Venue>;
    const created: import("../types/api").Venue = {
      id: Date.now(),
      name: body.name ?? "New Venue",
      address: body.address ?? "City Center",
      city: body.city ?? "Mumbai",
    };
    mockVenues.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // Inventory
  http.get(`${BASE}/api/inventory/shows/:id`, () =>
    HttpResponse.json({ showId: 101, totalSeats: 120, availableSeats: 45 }),
  ),

  // Bookings
  http.get(`${BASE}/api/bookings`, () => HttpResponse.json([BOOKING])),

  http.get(`${BASE}/api/bookings/:id`, ({ params }) => {
    if (Number(params.id) === 9001) return HttpResponse.json(BOOKING);
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),

  http.post(`${BASE}/api/bookings`, async ({ request }) => {
    const body = (await request.json()) as { simulatePaymentFailure?: boolean };
    if (body.simulatePaymentFailure) {
      return HttpResponse.json({ message: "Payment failed" }, { status: 402 });
    }
    return HttpResponse.json({ ...BOOKING, id: 9999 });
  }),

  http.post(`${BASE}/api/bookings/:id/cancel`, () =>
    HttpResponse.json({ ...BOOKING, status: "CANCELLED" }),
  ),
];
