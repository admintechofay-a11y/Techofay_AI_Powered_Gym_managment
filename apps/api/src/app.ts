import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { requestContextGuard } from './middleware/requestContextGuard.js';
import { noSqlSanitizer } from './middleware/sanitizeInput.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
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
import crmRoutes from './routes/crm.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import trainerRoutes from './routes/trainer.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import engagementRoutes from './routes/engagement.routes.js';
import { communicationRoutes } from './routes/communication.routes.js';
import { marketingRoutes } from './routes/marketing.routes.js';
import aiRoutes from './routes/ai.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import publicSiteRoutes from './routes/publicSite.routes.js';
import memberPwaRoutes from './routes/memberPwa.routes.js';
import ticketRoutes from './routes/ticket.routes.js';

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

  // 4b. Security Sanitization & Rate Limiting
  app.use(noSqlSanitizer);
  app.use('/api', apiRateLimiter);

  // 5. System Health Probes
  app.use('/', healthRoutes);

  // 6. OpenAPI Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Public & Member PWA Endpoints (Must be mounted before auth-scoped subrouters)
  app.use('/api/public', publicSiteRoutes);
  app.use('/api/member-pwa', memberPwaRoutes);

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

  // 8. Phase 3: CRM & Fitness Feature Routes
  app.use('/api/crm', crmRoutes);
  app.use('/api', bookingRoutes);
  app.use('/api/trainers', trainerRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/nutrition', nutritionRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/engagement', engagementRoutes);

  // 9. Phase 4: Communication & Marketing Automation
  app.use('/api/communication', communicationRoutes);
  app.use('/api/marketing', marketingRoutes);

  // 10. Phase 5: AI & Advanced Analytics
  app.use('/api/ai', aiRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  // 11. Phase 6: SaaS Platform, Inventory, Tickets & Financials
  app.use('/api/super-admin', superAdminRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/tickets', ticketRoutes);

  // 12. 404 Handler
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

  // 10. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
