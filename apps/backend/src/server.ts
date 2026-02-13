import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { accountRoutes } from './routes/account.routes';
import { categoryRoutes } from './routes/category.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { assetRoutes } from './routes/asset.routes';
import { liabilityRoutes } from './routes/liability.routes';
import { goalRoutes } from './routes/goal.routes';
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

    await server.register(cookie, {
      secret: config.COOKIE_SECRET,
      parseOptions: {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      },
    });

    await server.register(csrf, {
      cookieOpts: {
        httpOnly: false, // Must be false so frontend can read it
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
      },
      sessionPlugin: '@fastify/cookie',
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
    server.register(accountRoutes, { prefix: '/api' });
    server.register(categoryRoutes, { prefix: '/api' });
    server.register(transactionRoutes, { prefix: '/api' });
    server.register(dashboardRoutes, { prefix: '/api' });
    server.register(assetRoutes, { prefix: '/api' });
    server.register(liabilityRoutes, { prefix: '/api' });
    server.register(goalRoutes, { prefix: '/api' });

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
