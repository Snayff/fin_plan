import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const server = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Register global error handler
server.setErrorHandler(errorHandler);

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: config.CORS_ORIGIN.split(','),
      credentials: true,
    });

    await server.register(helmet, {
      contentSecurityPolicy: config.NODE_ENV === 'production',
    });

    await server.register(rateLimit, {
      max: config.RATE_LIMIT_MAX,
      timeWindow: config.RATE_LIMIT_TIME_WINDOW,
    });

    // Register WebSocket support
    await server.register(websocket);

    // Health check endpoint
    server.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // API routes
    server.register(authRoutes, { prefix: '/api/auth' });

    // WebSocket route for sync (placeholder for Phase 1)
    server.register(async (fastify) => {
      fastify.get('/ws/sync', { websocket: true }, (socket, req) => {
        socket.on('message', (message: Buffer) => {
          // Sync logic will be implemented here
          server.log.info(`Received WebSocket message: ${message.toString()}`);
          socket.send(JSON.stringify({ type: 'ack', message: 'Sync server ready' }));
        });

        socket.on('close', () => {
          server.log.info('WebSocket connection closed');
        });
      });
    });

    // Start server
    await server.listen({
      port: config.PORT,
      host: '0.0.0.0',
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
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, closing server...`);
    await server.close();
    process.exit(0);
  });
});

start();
