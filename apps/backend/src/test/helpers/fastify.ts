import Fastify from "fastify";
import cookie from "@fastify/cookie";

/**
 * Build a lightweight Fastify instance for route integration tests.
 * Registers only cookie plugin (needed for auth), skipping rate-limiting,
 * CSRF, and helmet so tests run fast and deterministically.
 */
export async function buildTestApp() {
  const app = Fastify({ logger: false });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "test-cookie-secret-that-is-at-least-32-characters-long-for-testing",
  });

  return app;
}
