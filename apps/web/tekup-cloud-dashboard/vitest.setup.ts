// Testing setup for React components
import '@testing-library/jest-dom/vitest';

// Polyfill matchMedia for tests (jsdom)
if (typeof window !== 'undefined' && !window.matchMedia) {
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
