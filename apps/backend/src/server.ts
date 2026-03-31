import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import csrf from "@fastify/csrf-protection";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { config } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { householdRoutes } from "./routes/households";
import { inviteRoutes } from "./routes/invite";
import { waterfallRoutes } from "./routes/waterfall.routes";
import { plannerRoutes } from "./routes/planner.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { snapshotRoutes } from "./routes/snapshots.routes";
import { reviewRoutes } from "./routes/review-session.routes";
import { setupRoutes } from "./routes/setup-session.routes";
import { auditLogRoutes } from "./routes/audit-log.routes";
import { assetsRoutes } from "./routes/assets.routes";
import { errorHandler } from "./middleware/errorHandler";

const server = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
  },
});

// Register global error handler
server.setErrorHandler(errorHandler);

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: config.CORS_ORIGIN.split(","),
      credentials: true,
    });

    await server.register(cookie, {
      secret: config.COOKIE_SECRET,
      parseOptions: {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      },
    });

    await server.register(csrf, {
      cookieOpts: {
        httpOnly: false, // Must be false so frontend can read it
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        path: "/", // Scope cookie to all paths (cookieOpts fully replaces defaults)
      },
      sessionPlugin: "@fastify/cookie",
    });

    await server.register(helmet, {
      contentSecurityPolicy: config.NODE_ENV === "production",
    });

    await server.register(rateLimit, {
      max: config.RATE_LIMIT_MAX,
      timeWindow: config.RATE_LIMIT_TIME_WINDOW,
      allowList: (req: { url: string }) => req.url === "/health",
    });

    // Register WebSocket support
    await server.register(websocket);

    // Health check endpoint
    server.get("/health", async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // API routes
    server.register(authRoutes, { prefix: "/api/auth" });
    server.register(householdRoutes, { prefix: "/api" });
    server.register(inviteRoutes, { prefix: "/api/auth" });
    server.register(waterfallRoutes, { prefix: "/api/waterfall" });
    server.register(plannerRoutes, { prefix: "/api/planner" });
    server.register(settingsRoutes, { prefix: "/api/settings" });
    server.register(snapshotRoutes, { prefix: "/api/snapshots" });
    server.register(reviewRoutes, { prefix: "/api/review-session" });
    server.register(setupRoutes, { prefix: "/api/setup-session" });
    server.register(auditLogRoutes, { prefix: "/api" });
    server.register(assetsRoutes, { prefix: "/api/assets" });

    // WebSocket route for sync (placeholder for Phase 1)
    server.register(async (fastify) => {
      fastify.get("/ws/sync", { websocket: true }, (socket, _req) => {
        socket.on("message", (message: Buffer) => {
          // Sync logic will be implemented here
          server.log.info(`Received WebSocket message: ${message.toString()}`);
          socket.send(JSON.stringify({ type: "ack", message: "Sync server ready" }));
        });

        socket.on("close", () => {
          server.log.info("WebSocket connection closed");
        });
      });
    });

    // Start server
    await server.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    server.log.info(`Server listening on http://localhost:${config.PORT}`);
    server.log.info(`Environment: ${config.NODE_ENV}`);
    server.log.info(`CORS Origin: ${config.CORS_ORIGIN}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, closing server...`);
    await server.close();
    process.exit(0);
  });
});

start();
