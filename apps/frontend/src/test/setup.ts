import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

import { afterAll, afterEach, beforeAll } from "bun:test";
import { server } from "./msw/server";

// Start MSW before all tests; reset per-test handler overrides after each; close after all
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  document.body.innerHTML = "";
});
afterAll(() => server.close());

// Set environment variable so api.ts uses http://localhost:3001 as base URL
// MSW path patterns ('/api/accounts') match requests to any origin, including this one
process.env.VITE_API_URL = "http://localhost:3001";

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: "", pathname: "/" },
  writable: true,
});
