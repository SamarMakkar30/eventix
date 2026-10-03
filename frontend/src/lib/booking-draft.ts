import { create } from "zustand";
import { z } from "zod";
import type { BookingDraft } from "@/types/api";

const KEY = "eventix_booking_draft";
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
const draftSchema = z.object({
  show: z.object({ id: z.number(), showType: z.enum(["MOVIE", "EVENT"]), movieId: z.number().nullable(), eventId: z.number().nullable(), title: z.string(), venueId: z.number(), venueName: z.string(), showDateTime: z.string(), price: z.number(), totalSeats: z.number() }),
  quantity: z.number().int().min(1).max(10),
  availableSeats: z.number().int().nonnegative(),
});
const storedSchema = z.object({ draft: draftSchema, expiresAt: z.number().finite() });

function readDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const result = storedSchema.safeParse(JSON.parse(raw));
    if (!result.success || result.data.expiresAt < Date.now()) { sessionStorage.removeItem(KEY); return null; }
    return result.data.draft;
  } catch { return null; }
}
function writeDraft(draft: BookingDraft) { sessionStorage.setItem(KEY, JSON.stringify({ draft, expiresAt: Date.now() + DRAFT_TTL_MS })); }
interface BookingDraftState { draft: BookingDraft | null; setDraft: (draft: BookingDraft) => void; clearDraft: () => void; }
export const useBookingDraftStore = create<BookingDraftState>((set) => ({
  draft: typeof window === "undefined" ? null : readDraft(),
  setDraft: (draft) => { writeDraft(draft); set({ draft }); },
  clearDraft: () => { sessionStorage.removeItem(KEY); set({ draft: null }); },
}));
export const saveBookingDraft = (draft: BookingDraft) => useBookingDraftStore.getState().setDraft(draft);
export const getBookingDraft = () => useBookingDraftStore.getState().draft ?? readDraft();
export const clearBookingDraft = () => useBookingDraftStore.getState().clearDraft();
