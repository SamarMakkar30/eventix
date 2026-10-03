import { describe, it, expect, beforeEach } from "vitest";
import {
  saveBookingDraft,
  getBookingDraft,
  clearBookingDraft,
} from "./booking-draft";
import type { BookingDraft } from "@/types/api";

const mockDraft: BookingDraft = {
  show: {
    id: 101,
    showType: "MOVIE",
    movieId: 1,
    eventId: null,
    title: "Oppenheimer",
    venueId: 5,
    venueName: "PVR Directors Cut",
    showDateTime: "2026-10-15T19:30:00Z",
    price: 450,
    totalSeats: 120,
  },
  quantity: 2,
  availableSeats: 45,
};

describe("booking-draft store", () => {
  beforeEach(() => {
    clearBookingDraft();
    sessionStorage.clear();
  });

  it("saves and retrieves a valid booking draft", () => {
    saveBookingDraft(mockDraft);
    const retrieved = getBookingDraft();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.show.title).toBe("Oppenheimer");
    expect(retrieved?.quantity).toBe(2);
    expect(retrieved?.availableSeats).toBe(45);
  });

  it("clears booking draft on demand", () => {
    saveBookingDraft(mockDraft);
    expect(getBookingDraft()).not.toBeNull();

    clearBookingDraft();
    expect(getBookingDraft()).toBeNull();
    expect(sessionStorage.getItem("eventix_booking_draft")).toBeNull();
  });

  it("returns null if session storage contains expired draft", () => {
    const expiredPayload = {
      draft: mockDraft,
      expiresAt: Date.now() - 1000, // expired 1s ago
    };
    sessionStorage.setItem("eventix_booking_draft", JSON.stringify(expiredPayload));

    const retrieved = getBookingDraft();
    expect(retrieved).toBeNull();
  });

  it("returns null if session storage contains corrupted schema", () => {
    sessionStorage.setItem("eventix_booking_draft", JSON.stringify({ draft: { invalid: true } }));
    const retrieved = getBookingDraft();
    expect(retrieved).toBeNull();
  });
});
