import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

import { mock, afterEach } from "bun:test";

// Clean up DOM between tests (bun test doesn't auto-cleanup like vitest/jest)
afterEach(() => {
  document.body.innerHTML = "";
});

// Mock global fetch
global.fetch = mock(() => {}) as any;

// Set environment variable
process.env.VITE_API_URL = "http://localhost:3001";

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: "", pathname: "/" },
  writable: true,
});
