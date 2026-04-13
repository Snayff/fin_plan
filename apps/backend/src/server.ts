import { buildApp } from "./app";
import { config } from "./config/env";

async function start() {
  const server = await buildApp({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  try {
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

  // Graceful shutdown
  const signals = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}, closing server...`);
      await server.close();
      process.exit(0);
    });
  });
}

start();
