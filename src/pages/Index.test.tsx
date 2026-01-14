import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Index from "./Index";

// Simple IntersectionObserver mock that lets tests control when intersections occur

type ObserverRecord = {
  callback: (entries: any[], observer: any) => void;
  instance: { disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> };
  options: any;
};

const observers: ObserverRecord[] = [];

beforeEach(() => {
  observers.length = 0;

  class MockIntersectionObserver {
    callback: (entries: any[], observer: any) => void;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    options: any;

    constructor(callback: (entries: any[], observer: any) => void, options?: any) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.options = options;

      observers.push({ callback, instance: this as any, options });
    }
  }

  (globalThis as any).IntersectionObserver = MockIntersectionObserver as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const triggerIntersection = (index: number, isIntersecting: boolean) => {
  const record = observers[index];
  if (!record) throw new Error(`No IntersectionObserver at index ${index}`);

  const entry = { isIntersecting };
  record.callback([entry], record.instance);
};

describe("LazySection", () => {
  it("defers rendering children until element is near viewport", () => {
    render(<Index />);

    // PropertyDetails content should not be rendered until intersection occurs
    expect(
      screen.queryByText(/East Hampton Retreat Close to Everything/i)
    ).not.toBeInTheDocument();

    // Ensure the observer is configured to start observing before the element
    // actually enters the viewport
    expect(observers[0]?.options?.rootMargin).toBe("200px");
  });

  it("sets isVisible to true when element intersects viewport", async () => {
    render(<Index />);

    // Simulate the first LazySection (wrapping PropertyDetails) entering the viewport
    triggerIntersection(0, true);

    expect(
      await screen.findByText(/East Hampton Retreat Close to Everything/i)
    ).toBeInTheDocument();
  });

  it("disconnects IntersectionObserver after becoming visible", () => {
    render(<Index />);

    triggerIntersection(0, true);

    const firstObserver = observers[0];
    expect(firstObserver.instance.disconnect).toHaveBeenCalled();
  });
});

describe("Index composition", () => {
  it("renders PropertyDetails within LazySection and Suspense after intersection", async () => {
    render(<Index />);

    // First LazySection corresponds to PropertyDetails
    triggerIntersection(0, true);

    expect(
      await screen.findByText(/East Hampton Retreat Close to Everything/i)
    ).toBeInTheDocument();
  });

  it("renders BottomBar within LazySection and Suspense after intersection", async () => {
    render(<Index />);

    // First LazySection is PropertyDetails, second is BottomBar
    triggerIntersection(0, true);
    triggerIntersection(1, true);

    expect(
      await screen.findByRole("button", { name: /express interest/i })
    ).toBeInTheDocument();
  });
});
