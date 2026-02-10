import "@testing-library/jest-dom";

// Mock global fetch
global.fetch = vi.fn();

// Mock import.meta.env
vi.stubEnv("VITE_API_URL", "http://localhost:3001");

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: "", pathname: "/" },
  writable: true,
});
