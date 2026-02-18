// Set environment variables BEFORE any module imports.
// This is critical because config/env.ts validates env at import time.
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.DATABASE_URL = "postgresql://finplan:finplan_dev_password@localhost:5432/finplan_test";
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-characters-long-for-testing";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-that-is-at-least-32-characters-long-for-testing";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.COOKIE_SECRET = "test-cookie-secret-that-is-at-least-32-characters-long-for-testing";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.REDIS_URL = "redis://localhost:6379";
