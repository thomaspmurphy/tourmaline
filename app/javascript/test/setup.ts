import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as Storage;

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
