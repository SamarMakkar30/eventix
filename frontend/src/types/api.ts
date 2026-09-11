export type Role = "CUSTOMER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ShowType = "MOVIE" | "EVENT";

export interface Show {
  id: number;
  showType: ShowType;
  movieId: number | null;
  eventId: number | null;
  title: string;
  venueId: number;
  venueName: string;
  showDateTime: string;
  price: number;
  totalSeats: number;
}

export interface Inventory {
  showId: number;
  totalSeats: number;
  availableSeats: number;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "PAYMENT_FAILED" | "CANCELLED";

export interface Booking {
  id: number;
  showId: number;
  showTitle: string;
  venueName: string;
  showDateTime: string;
  quantity: number;
  pricePerTicket: number;
  totalAmount: number;
  status: BookingStatus;
  paymentId: number | null;
  createdAt: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string | null;
  genre: string | null;
  language: string | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  rating: number | null;
}

export interface Event {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  bannerUrl: string | null;
}

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
}

export interface BookingDraft {
  show: Show;
  quantity: number;
  availableSeats: number;
}
