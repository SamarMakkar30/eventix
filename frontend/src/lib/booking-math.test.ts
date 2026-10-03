import { describe, expect, it } from "vitest";
import { ticketTotal } from "./booking-math";

describe("ticketTotal", () => {
  it("calculates the total in INR subunits supplied by the catalog", () => {
    expect(ticketTotal(425, 3)).toBe(1275);
  });

  it("rejects unsupported quantities before a booking request is made", () => {
    expect(() => ticketTotal(425, 0)).toThrow("Ticket quantity");
    expect(() => ticketTotal(425, 11)).toThrow("Ticket quantity");
  });
});
