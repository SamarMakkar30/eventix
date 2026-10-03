import { describe, it, expect } from "vitest";
import { cn, money, dateTime, dateOnly, initials, posterGradient } from "./utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("joins class names while filtering out falsy values", () => {
      expect(cn("btn", false, "btn--primary", null, undefined, "active")).toBe(
        "btn btn--primary active"
      );
    });
  });

  describe("money", () => {
    it("formats Indian Rupee correctly", () => {
      const formatted = money(500);
      expect(formatted).toContain("500");
    });
  });

  describe("dateTime & dateOnly", () => {
    it("formats date correctly", () => {
      const iso = "2026-10-15T19:30:00Z";
      const dt = dateTime(iso);
      expect(dt).toBeTruthy();

      const dOnly = dateOnly(iso);
      expect(dOnly).toBeTruthy();
    });
  });

  describe("initials", () => {
    it("extracts up to two uppercase letters from names", () => {
      expect(initials("John Doe")).toBe("JD");
      expect(initials("Alice")).toBe("A");
      expect(initials("Sarah Jane Connor")).toBe("SJ");
    });
  });

  describe("posterGradient", () => {
    it("deterministically returns fallback gradient name based on seed", () => {
      expect(posterGradient(0)).toBe("ember");
      expect(posterGradient(1)).toBe("sand");
      expect(posterGradient(6)).toBe("ember");
    });
  });
});
