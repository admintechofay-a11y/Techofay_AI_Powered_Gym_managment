import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { requestContextGuard } from './middleware/requestContextGuard.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import integrationRoutes from './routes/integrations.routes.js';
import branchRoutes from './routes/branch.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import healthRoutes from './routes/health.routes.js';
import memberRoutes from './routes/member.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import billingRoutes from './routes/billing.routes.js';
import operationsRoutes from './routes/operations.routes.js';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and local dev previews
    }),
  );

  // 2. CORS whitelist
  app.use(
    cors({
      origin: process.env.WEB_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant-Id',
        'X-Branch-Id',
        'X-Tenant-Subdomain',
        'X-Request-Id',
        'X-Correlation-Id',
        'Idempotency-Key',
      ],
    }),
  );

  // 3. Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie_secret'));

  // 4. Request Context Guard (AsyncLocalStorage)
  app.use(requestContextGuard);

  // 5. System Health Probes
  app.use('/', healthRoutes);

  // 6. OpenAPI Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 7. Core Feature Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/integrations', integrationRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/memberships', membershipRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/operations', operationsRoutes);

  // 8. 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        requestId: req.correlationId,
      },
    });
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
