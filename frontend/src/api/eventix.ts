import { request } from "./client";
import type {
  AuthResponse,
  Booking,
  Event,
  Inventory,
  Movie,
  Show,
  Venue,
} from "../types/api";

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request<AuthResponse["user"]>("/api/auth/me"),
  shows: () => request<Show[]>("/api/catalog/shows"),
  show: (id: string | number) => request<Show>(`/api/catalog/shows/${id}`),
  inventory: (showId: string | number) =>
    request<Inventory>(`/api/inventory/shows/${showId}`),
  movies: () => request<Movie[]>("/api/catalog/movies"),
  events: () => request<Event[]>("/api/catalog/events"),
  venues: () => request<Venue[]>("/api/catalog/venues"),
  bookings: () => request<Booking[]>("/api/bookings"),
  booking: (id: string | number) => request<Booking>(`/api/bookings/${id}`),
  createBooking: (
    showId: number,
    quantity: number,
    simulatePaymentFailure = false,
  ) =>
    request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ showId, quantity, simulatePaymentFailure }),
    }),
  cancelBooking: (id: number) =>
    request<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" }),
  createMovie: (input: Omit<Movie, "id">) =>
    request<Movie>("/api/catalog/movies", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMovie: (id: number, input: Omit<Movie, "id">) =>
    request<Movie>(`/api/catalog/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteMovie: (id: number) =>
    request<void>(`/api/catalog/movies/${id}`, { method: "DELETE" }),
  createEvent: (input: Omit<Event, "id">) =>
    request<Event>("/api/catalog/events", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateEvent: (id: number, input: Omit<Event, "id">) =>
    request<Event>(`/api/catalog/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteEvent: (id: number) =>
    request<void>(`/api/catalog/events/${id}`, { method: "DELETE" }),
  createVenue: (input: Omit<Venue, "id">) =>
    request<Venue>("/api/catalog/venues", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createShow: (input: Omit<Show, "id" | "title" | "venueName">) =>
    request<Show>("/api/catalog/shows", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
