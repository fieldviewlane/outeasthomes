import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Index from "./Index";
import { PROPERTY_CONFIG } from "@/config/property";

// Simple IntersectionObserver mock that lets tests control when intersections occur

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  instance: IntersectionObserver;
  options?: IntersectionObserverInit;
};

const observers: ObserverRecord[] = [];

beforeEach(() => {
  observers.length = 0;

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    root: Element | null = null;
    rootMargin: string = "";
    thresholds: ReadonlyArray<number> = [];
    options?: IntersectionObserverInit;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.unobserve = vi.fn();
      this.options = options;
      this.rootMargin = options?.rootMargin || "";

      observers.push({ callback, instance: this as unknown as IntersectionObserver, options });
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const triggerIntersection = (index: number, isIntersecting: boolean) => {
  const record = observers[index];
  if (!record) throw new Error(`No IntersectionObserver at index ${index}`);

  const entry = {
    isIntersecting,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    target: {} as Element,
    time: Date.now(),
  };
  record.callback([entry], record.instance);
};

describe("LazySection", () => {
  it("defers rendering children until element is near viewport", () => {
    render(<Index />);

    // PropertyDetails content should not be rendered until intersection occurs
    expect(
      screen.queryByText(PROPERTY_CONFIG.headline)
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
      await screen.findByText(PROPERTY_CONFIG.headline)
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
      await screen.findByText(PROPERTY_CONFIG.headline)
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
