export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Techofay GymOS API Documentation',
    version: '1.0.0',
    description:
      'API specification for Techofay GymOS - AI-Powered Multi-Tenant SaaS Gym Management Platform',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new Gym Tenant Organization with Owner account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gymName', 'subdomain', 'ownerName', 'email', 'phone', 'password'],
                properties: {
                  gymName: { type: 'string', example: 'Gold Fitness Club' },
                  subdomain: { type: 'string', example: 'goldfitness' },
                  ownerName: { type: 'string', example: 'Vikram Malhotra' },
                  email: { type: 'string', format: 'email', example: 'vikram@goldfitness.com' },
                  phone: { type: 'string', example: '+919876543210' },
                  password: { type: 'string', example: 'StrongP@ssw0rd' },
                  branchName: { type: 'string', example: 'Main Branch' },
                  city: { type: 'string', example: 'Mumbai' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tenant and owner successfully created' },
          409: { description: 'Subdomain already taken' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email, password, and optional 2FA code',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  totpCode: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
          429: { description: 'Account locked due to consecutive failures' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate session tokens',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Tokens refreshed' },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout and revoke active session',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Logged out' },
        },
      },
    },
    '/integrations': {
      get: {
        summary: 'Get configuration and status of all third-party integrations',
        tags: ['Integrations'],
        responses: {
          200: { description: 'Integration status list' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Service liveness check',
        tags: ['System'],
        responses: {
          200: { description: 'Service alive' },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'Service readiness check (MongoDB & Redis connectivity)',
        tags: ['System'],
        responses: {
          200: { description: 'Service ready' },
          503: { description: 'Service not ready' },
        },
      },
    },
  },
};
