// Contract-accurate mock of the Eventix API gateway for UI walkthrough testing.
// Mirrors the REAL backend services (auth 8081, catalog 8082, inventory 8083, bookings 8084)
// including their gaps: no DELETE /api/catalog/shows/:id and no GET /api/bookings/admin/all.
import http from "node:http";

const PORT = 8080;

// ---------- seed data ----------
const now = Date.now();
const day = 86_400_000;
const iso = (offsetDays, hour, minute = 0) => {
  const d = new Date(now + offsetDays * day);
  d.setHours(hour, minute, 0, 0);
  const p = (n) => String(n).padStart(2, "0");
  // LocalDateTime-style string (no offset) — exactly what the backend returns
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

const venues = [
  { id: 1, name: "Grand PVR Arena", address: "12 Marine Drive", city: "Mumbai" },
  { id: 2, name: "Phoenix Convention Hall", address: "88 MG Road", city: "Bengaluru" },
];
const movies = [
  { id: 1, title: "Neon Monsoon", description: "A cyberpunk thriller set in flooded Mumbai.", genre: "Sci-Fi", language: "Hindi", durationMinutes: 142, posterUrl: null, rating: 8.2 },
  { id: 2, title: "The Quiet Coast", description: "Two sisters revisit a childhood shoreline.", genre: "Drama", language: "English", durationMinutes: 118, posterUrl: null, rating: 7.6 },
];
const events = [
  { id: 1, name: "Midnight Bass Collective", description: "Open-air electronic night with live visuals.", category: "Music", bannerUrl: null },
  { id: 2, name: "Founders Fireside 2026", description: "Panels and workshops for early-stage founders.", category: "Conference", bannerUrl: null },
];
const shows = [
  { id: 1, showType: "MOVIE", movieId: 1, eventId: null, title: "Neon Monsoon", venueId: 1, venueName: "Grand PVR Arena", showDateTime: iso(2, 18, 30), price: 350, totalSeats: 120 },
  { id: 2, showType: "MOVIE", movieId: 2, eventId: null, title: "The Quiet Coast", venueId: 1, venueName: "Grand PVR Arena", showDateTime: iso(3, 20, 0), price: 280, totalSeats: 80 },
  { id: 3, showType: "EVENT", movieId: null, eventId: 1, title: "Midnight Bass Collective", venueId: 2, venueName: "Phoenix Convention Hall", showDateTime: iso(5, 21, 0), price: 1500, totalSeats: 500 },
  { id: 4, showType: "EVENT", movieId: null, eventId: 2, title: "Founders Fireside 2026", venueId: 2, venueName: "Phoenix Convention Hall", showDateTime: iso(7, 10, 0), price: 999, totalSeats: 200 },
  { id: 5, showType: "MOVIE", movieId: 1, eventId: null, title: "Neon Monsoon", venueId: 2, venueName: "Phoenix Convention Hall", showDateTime: iso(1, 23, 0), price: 320, totalSeats: 60 }, // nearly sold out
  { id: 6, showType: "MOVIE", movieId: 2, eventId: null, title: "The Quiet Coast", venueId: 1, venueName: "Grand PVR Arena", showDateTime: iso(-2, 18, 30), price: 260, totalSeats: 90 }, // past
  { id: 7, showType: "EVENT", movieId: null, eventId: 1, title: "Midnight Bass Collective", venueId: 1, venueName: "Grand PVR Arena", showDateTime: iso(4, 19, 0), price: 1200, totalSeats: 100 }, // sold out
];
const inventory = [
  { showId: 1, totalSeats: 120, availableSeats: 87 },
  { showId: 2, totalSeats: 80, availableSeats: 64 },
  { showId: 3, totalSeats: 500, availableSeats: 412 },
  { showId: 4, totalSeats: 200, availableSeats: 155 },
  { showId: 5, totalSeats: 60, availableSeats: 3 },
  { showId: 6, totalSeats: 90, availableSeats: 0 },
  { showId: 7, totalSeats: 100, availableSeats: 0 },
];

const users = {
  "customer@eventix.test": { id: 1, name: "Asha Customer", email: "customer@eventix.test", role: "CUSTOMER", password: "password123" },
  "admin@eventix.test": { id: 2, name: "Arjun Admin", email: "admin@eventix.test", role: "ADMIN", password: "admin12345" },
};
let nextUserId = 3;
let bookingSeq = 1;
const bookings = [
  {
    id: bookingSeq++, showId: 6, showTitle: "The Quiet Coast", venueName: "Grand PVR Arena",
    showDateTime: iso(-2, 18, 30), quantity: 2, pricePerTicket: 260, totalAmount: 520,
    status: "CONFIRMED", paymentId: 101, createdAt: new Date(now - 4 * day).toISOString(),
  },
  {
    id: bookingSeq++, showId: 3, showTitle: "Midnight Bass Collective", venueName: "Phoenix Convention Hall",
    showDateTime: iso(5, 21, 0), quantity: 3, pricePerTicket: 1500, totalAmount: 4500,
    status: "PENDING", paymentId: null, createdAt: new Date(now - 1 * day).toISOString(),
  },
  {
    id: bookingSeq++, showId: 4, showTitle: "Founders Fireside 2026", venueName: "Phoenix Convention Hall",
    showDateTime: iso(7, 10, 0), quantity: 1, pricePerTicket: 999, totalAmount: 999,
    status: "CANCELLED", paymentId: null, createdAt: new Date(now - 2 * day).toISOString(),
  },
];

function cors(req) {
  return {
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
function send(req, res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, { ...cors(req), "Content-Type": "application/json" });
  res.end(payload);
}
const authUser = (req) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const email = Buffer.from(token, "base64").toString("utf8").split("|")[0];
  const u = users[email];
  if (!u) return null;
  const { password: _pw, ...safe } = u;
  return safe;
};
const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "");
  const method = req.method;

  if (method === "OPTIONS") { res.writeHead(204, cors(req)); return res.end(); }

  // ---- auth ----
  if (path === "/api/auth/login" && method === "POST") {
    const { email, password } = await readBody(req);
    const u = users[String(email || "").toLowerCase()];
    if (!u || u.password !== password) return send(req, res, 401, { status: 401, message: "Invalid credentials" });
    const { password: _pw, ...safe } = u;
    const token = Buffer.from(`${u.email}|mock`).toString("base64");
    return send(req, res, 200, { token, user: safe });
  }
  if (path === "/api/auth/register" && method === "POST") {
    const { name, email, password } = await readBody(req);
    if (users[String(email || "").toLowerCase()]) return send(req, res, 409, { status: 409, message: "Email already registered" });
    if (!name || !email || !password || String(password).length < 8)
      return send(req, res, 400, { status: 400, message: "Validation failed", fields: { password: "Password must be at least 8 characters" } });
    const u = { id: nextUserId++, name, email: String(email), role: "CUSTOMER", password };
    users[u.email] = u;
    const { password: _pw, ...safe } = u;
    const token = Buffer.from(`${u.email}|mock`).toString("base64");
    return send(req, res, 200, { token, user: safe });
  }
  if (path === "/api/auth/me" && method === "GET") {
    const u = authUser(req);
    if (!u) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    return send(req, res, 200, u);
  }

  // ---- catalog: shows ----
  if (path === "/api/catalog/shows" && method === "GET") return send(req, res, 200, shows);
  if (path === "/api/catalog/shows" && method === "POST") {
    if (!authUser(req)) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    const b = await readBody(req);
    const venue = venues.find((v) => v.id === Number(b.venueId));
    const id = Math.max(...shows.map((s) => s.id)) + 1;
    const title = b.showType === "MOVIE" ? movies.find((m) => m.id === b.movieId)?.title ?? "Untitled" : events.find((e) => e.id === b.eventId)?.name ?? "Untitled";
    const show = { id, showType: b.showType ?? "MOVIE", movieId: b.movieId ?? null, eventId: b.eventId ?? null, title, venueId: Number(b.venueId), venueName: venue?.name ?? "Unknown Venue", showDateTime: b.showDateTime, price: Number(b.price), totalSeats: Number(b.totalSeats) };
    shows.push(show);
    inventory.push({ showId: id, totalSeats: show.totalSeats, availableSeats: show.totalSeats });
    return send(req, res, 200, show);
  }
  const showIdMatch = path.match(/^\/api\/catalog\/shows\/(\d+)$/);
  if (showIdMatch) {
    const show = shows.find((s) => s.id === Number(showIdMatch[1]));
    if (method === "GET") return show ? send(req, res, 200, show) : send(req, res, 404, { status: 404, message: "Show not found" });
    // REAL backend gap: ShowController has no DELETE route → 405 (Spring default for unmatched method)
    if (method === "DELETE") return send(req, res, 405, { status: 405, message: "Method Not Allowed" });
  }

  // ---- catalog: movies / events / venues ----
  if (path === "/api/catalog/movies" && method === "GET") return send(req, res, 200, movies);
  if (path === "/api/catalog/events" && method === "GET") return send(req, res, 200, events);
  if (path === "/api/catalog/venues" && method === "GET") return send(req, res, 200, venues);

  // ---- inventory ----
  const invMatch = path.match(/^\/api\/inventory\/shows\/(\d+)$/);
  if (invMatch && method === "GET") {
    const inv = inventory.find((i) => i.showId === Number(invMatch[1]));
    return inv ? send(req, res, 200, inv) : send(req, res, 404, { status: 404, message: "Inventory not found" });
  }

  // ---- bookings ----
  if (path === "/api/bookings" && method === "GET") {
    const u = authUser(req);
    if (!u) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    // REAL backend gap: returns the CURRENT user's bookings for everyone (admin included).
    return send(req, res, 200, bookings);
  }
  if (path === "/api/bookings" && method === "POST") {
    const u = authUser(req);
    if (!u) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    const b = await readBody(req);
    const show = shows.find((s) => s.id === Number(b.showId));
    if (!show) return send(req, res, 404, { status: 404, message: "Show not found" });
    const qty = Number(b.quantity);
    const inv = inventory.find((i) => i.showId === show.id);
    if (!inv || inv.availableSeats < qty) return send(req, res, 409, { status: 409, message: "Not enough seats available" });
    if (b.simulatePaymentFailure) return send(req, res, 402, { status: 402, message: "Payment declined" });
    inv.availableSeats -= qty;
    const booking = {
      id: bookingSeq++, showId: show.id, showTitle: show.title, venueName: show.venueName,
      showDateTime: show.showDateTime, quantity: qty, pricePerTicket: show.price,
      totalAmount: show.price * qty, status: "CONFIRMED", paymentId: 900 + bookingSeq,
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    return send(req, res, 201, booking);
  }
  if (path === "/api/bookings/admin/all" && method === "GET") {
    // REAL backend gap: no such route; Spring falls through to /bookings/{id} with id="admin" → 400
    return send(req, res, 400, { status: 400, message: "Type mismatch" });
  }
  const cancelMatch = path.match(/^\/api\/bookings\/(\d+)\/cancel$/);
  if (cancelMatch && method === "POST") {
    const u = authUser(req);
    if (!u) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    const booking = bookings.find((bk) => bk.id === Number(cancelMatch[1]));
    if (!booking) return send(req, res, 404, { status: 404, message: "Booking not found" });
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED")
      return send(req, res, 409, { status: 409, message: "Booking cannot be cancelled" });
    booking.status = "CANCELLED";
    const inv = inventory.find((i) => i.showId === booking.showId);
    if (inv) inv.availableSeats += booking.quantity;
    return send(req, res, 200, booking);
  }
  const bookingMatch = path.match(/^\/api\/bookings\/(\d+)$/);
  if (bookingMatch && method === "GET") {
    const u = authUser(req);
    if (!u) return send(req, res, 401, { status: 401, message: "Unauthorized" });
    const booking = bookings.find((bk) => bk.id === Number(bookingMatch[1]));
    return booking ? send(req, res, 200, booking) : send(req, res, 404, { status: 404, message: "Booking not found" });
  }

  return send(req, res, 404, { status: 404, message: "Not Found" });
});

server.listen(PORT, () => console.log(`Mock Eventix gateway on http://localhost:${PORT}`));
