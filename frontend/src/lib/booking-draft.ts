import type { BookingDraft } from "../types/api";

const KEY = "eventix_booking_draft";

export const saveBookingDraft = (draft: BookingDraft) =>
  sessionStorage.setItem(KEY, JSON.stringify(draft));
export const getBookingDraft = (): BookingDraft | null => {
  try {
    const value = sessionStorage.getItem(KEY);
    return value ? (JSON.parse(value) as BookingDraft) : null;
  } catch {
    return null;
  }
};
export const clearBookingDraft = () => sessionStorage.removeItem(KEY);
