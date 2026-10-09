import { Redis } from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: string; expiresAt: number }>();
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    if (process.env.NODE_ENV !== 'test') {
      try {
        const RedisConstructor: any = Redis;
        this.redis = new RedisConstructor(redisUrl, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: () => null, // Do not spam retries if offline
        });

        this.redis?.on('connect', () => {
          this.isConnected = true;
        });

        this.redis?.on('error', () => {
          this.isConnected = false;
        });
      } catch {
        this.isConnected = false;
      }
    }
  }

  private buildKey(tenantId: string, key: string): string {
    return `gymos:tenant:${tenantId}:${key}`;
  }

  public async get<T>(tenantId: string, key: string): Promise<T | null> {
    const fullKey = this.buildKey(tenantId, key);

    if (this.isConnected && this.redis) {
      try {
        const raw = await this.redis.get(fullKey);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fall back to memory cache
      }
    }

    const entry = this.memoryCache.get(fullKey);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return JSON.parse(entry.value) as T;
      }
      this.memoryCache.delete(fullKey);
    }

    return null;
  }

  public async set(tenantId: string, key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const fullKey = this.buildKey(tenantId, key);
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.redis) {
      try {
        await this.redis.set(fullKey, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        // Fall through to memory cache
      }
    }

    this.memoryCache.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async invalidate(tenantId: string, key?: string): Promise<void> {
    if (key) {
      const fullKey = this.buildKey(tenantId, key);
      this.memoryCache.delete(fullKey);
      if (this.isConnected && this.redis) {
        try {
          await this.redis.del(fullKey);
        } catch {
          // ignore
        }
      }
    } else {
      // Invalidate all for tenant
      const prefix = `gymos:tenant:${tenantId}:`;
      for (const k of this.memoryCache.keys()) {
        if (k.startsWith(prefix)) {
          this.memoryCache.delete(k);
        }
      }
      if (this.isConnected && this.redis) {
        try {
          const keys = await this.redis.keys(`${prefix}*`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  public async del(tenantId: string, key: string): Promise<void> {
    return this.invalidate(tenantId, key);
  }

  public async wrap<T>(
    tenantId: string,
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(tenantId, key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(tenantId, key, fresh, ttlSeconds);
    return fresh;
  }
}

export const cacheService = new CacheService();
