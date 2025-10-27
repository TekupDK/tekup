// Testing setup for React components
import "@testing-library/jest-dom/vitest";

// Ensure Vitest uses mock data paths instead of hitting real Supabase
if (!process.env.VITE_MOCK_DATA) {
  process.env.VITE_MOCK_DATA = "true";
}

if (!process.env.VITE_APP_ENV) {
  process.env.VITE_APP_ENV = "development";
}

// Polyfill matchMedia for tests (jsdom)
if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-expect-error allow test polyfill
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Polyfill ResizeObserver for tests (jsdom) - required by Recharts
if (typeof window !== "undefined" && !window.ResizeObserver) {
  // @ts-expect-error allow test polyfill
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
