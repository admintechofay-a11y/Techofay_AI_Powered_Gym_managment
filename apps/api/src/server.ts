import mongoose from 'mongoose';
import { env } from './config/env.js';
import { createApp } from './app.js';

async function bootstrap() {
  console.log(`[BOOT] Initializing Techofay GymOS API in ${env.NODE_ENV} mode...`);

  // Connect to MongoDB
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[DATABASE] Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (error) {
    if (env.MONGODB_URI.includes('replicaSet=')) {
      const fallbackUri = env.MONGODB_URI.replace(/[?&]replicaSet=[^&]+/, '');
      console.log(`[DATABASE] Replica set not reachable, falling back to standalone MongoDB at ${fallbackUri}...`);
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`[DATABASE] Connected to standalone MongoDB at ${fallbackUri}`);
      } catch (fallbackError) {
        console.warn(`[DATABASE] Standalone MongoDB connection error: ${fallbackError}`);
      }
    } else {
      console.warn(`[DATABASE] MongoDB connection warning: ${error}`);
      console.warn('[DATABASE] If running locally without Docker, run: docker compose up -d mongo');
    }
  }

  const app = createApp();
  const port = env.PORT || 5000;

  const server = app.listen(port, () => {
    console.log(`[SERVER] Techofay GymOS API running on http://localhost:${port}`);
    console.log(`[SERVER] OpenAPI documentation available at http://localhost:${port}/api/docs`);
    console.log(`[SERVER] Health endpoints available at /health and /ready`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[SHUTDOWN] Received ${signal}. Closing gracefully...`);
    server.close(async () => {
      await mongoose.disconnect();
      console.log('[SHUTDOWN] HTTP server closed and database disconnected.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to start API server:', err);
  process.exit(1);
});
