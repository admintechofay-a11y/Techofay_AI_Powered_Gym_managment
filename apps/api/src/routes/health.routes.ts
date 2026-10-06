import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Liveness probe
router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'techofay-gymos-api',
  });
});

// Readiness probe
router.get('/ready', async (_req: Request, res: Response) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (!isMongoConnected) {
    return res.status(503).json({
      status: 'unavailable',
      checks: {
        database: 'disconnected',
      },
    });
  }

  return res.status(200).json({
    status: 'ready',
    checks: {
      database: 'connected',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
