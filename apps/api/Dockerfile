# ==========================================
# GymOS Backend API - Production Dockerfile
# Multi-stage, Non-root, Minimal Footprint
# ==========================================

# 1. Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace config and package definitions
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies including devDependencies for build
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package then API package
RUN pnpm --filter @gymos/shared build
RUN pnpm --filter @gymos/api build

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthcheck and dumb-init for proper signal forwarding
RUN apk add --no-cache curl dumb-init

ENV NODE_ENV=production
ENV PORT=5000

# Copy workspace dependencies and built dist files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Ensure uploads directory exists and is writable by non-root user
RUN mkdir -p /app/apps/api/uploads && chown -R node:node /app

# Switch to unprivileged non-root user
USER node

WORKDIR /app/apps/api

EXPOSE 5000

# Container healthcheck against /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
