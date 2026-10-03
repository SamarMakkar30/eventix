import React from "react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, Input, StatusBadge, EmptyState, ErrorState } from "./ui";

describe("UI Components", () => {
  describe("Button", () => {
    it("renders children and handles click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Book Now</Button>);

      const btn = screen.getByRole("button", { name: /book now/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables button when loading is true", () => {
      render(<Button loading>Processing</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
    });
  });

  describe("Input", () => {
    it("renders input with label and handles text change", () => {
      render(<Input label="Email address" id="email" defaultValue="test@example.com" />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it("displays error message and sets aria-invalid", () => {
      render(<Input label="Password" id="pwd" error="Password is required" />);
      const input = screen.getByLabelText(/password/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("Password is required");
    });
  });

  describe("StatusBadge", () => {
    it("displays correct human-readable text for statuses", () => {
      const { rerender } = render(<StatusBadge status="CONFIRMED" />);
      expect(screen.getByText("Confirmed")).toBeInTheDocument();

      rerender(<StatusBadge status="CANCELLED" />);
      expect(screen.getByText("Cancelled")).toBeInTheDocument();

      rerender(<StatusBadge status="PAYMENT_FAILED" />);
      expect(screen.getByText("Payment failed")).toBeInTheDocument();
    });
  });

  describe("EmptyState & ErrorState", () => {
    it("renders empty state with title and detail", () => {
      render(
        <EmptyState
          title="No shows found"
          detail="Try adjusting your search criteria"
        />
      );
      expect(screen.getByText("No shows found")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search criteria")).toBeInTheDocument();
    });

    it("renders error state with retry action", () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Unable to load catalog"
          detail="Gateway connection timeout"
          retry={handleRetry}
        />
      );
      expect(screen.getByText("Unable to load catalog")).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
