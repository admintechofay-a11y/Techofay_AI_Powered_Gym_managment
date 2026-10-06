import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_URL: z.string().default('http://localhost:5000'),
  WEB_URL: z.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/gymos?replicaSet=rs0'),
  MONGODB_DEBUG: z.string().transform((v) => v === 'true').default('false'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  EMAIL_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  STORAGE_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  PAYMENT_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  WHATSAPP_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  SMS_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  PUSH_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  AI_ADAPTER: z.enum(['real', 'mock']).default('mock'),
  BIOMETRIC_ADAPTER: z.enum(['real', 'mock']).default('mock'),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse({
    ...process.env,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_super_secure_32_characters_123',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_super_secure_32_characters_456',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_cookie_secret_super_secure_32_characters_789',
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('CRITICAL: Environment variable validation failed on startup:');
    console.error(JSON.stringify(error.format(), null, 2));
  }
  throw error;
}

export const env = parsedEnv;
