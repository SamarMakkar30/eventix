import type { Booking } from "@/types/api";
import { dateTime, money } from "@/lib/utils";

const escapeIcs = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCalendar(booking: Booking) {
  const start = new Date(booking.showDateTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eventix//Booking//EN", "BEGIN:VEVENT", `UID:eventix-booking-${booking.id}@eventix`, `DTSTAMP:${stamp(booking.createdAt)}`, `DTSTART:${stamp(start.toISOString())}`, `DTEND:${stamp(end.toISOString())}`, `SUMMARY:${escapeIcs(booking.showTitle)}`, `LOCATION:${escapeIcs(booking.venueName)}`, `DESCRIPTION:${escapeIcs(`Eventix booking EVX-${String(booking.id).padStart(6, "0")}`)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  download(`eventix-${booking.id}.ics`, content, "text/calendar;charset=utf-8");
}

export function downloadTicket(booking: Booking) {
  const content = ["EVENTIX", "BOOKING CONFIRMED", "", `Reference: EVX-${String(booking.id).padStart(6, "0")}`, `Show: ${booking.showTitle}`, `When: ${dateTime(booking.showDateTime)}`, `Where: ${booking.venueName}`, `Tickets: ${booking.quantity}`, `Total: ${money(booking.totalAmount)}`, `Status: ${booking.status}`, "", "Keep this ticket ready at the venue."].join("\n");
  download(`eventix-ticket-${booking.id}.txt`, content, "text/plain;charset=utf-8");
}
