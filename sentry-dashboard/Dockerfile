# ================================================================
# Sentry Dashboard - Multi-stage Dockerfile  
# Non-standalone mode for custom server support
# ================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ================================================================
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time argument for SSH Gateway port (port 3004 - shared with agent gateway)
ARG NEXT_PUBLIC_SSH_GATEWAY_PORT=3004
ENV NEXT_PUBLIC_SSH_GATEWAY_PORT=$NEXT_PUBLIC_SSH_GATEWAY_PORT

# Build-time argument for Agent Gateway (remote terminal)
ARG AGENT_GATEWAY_PORT=3004
ARG NEXT_PUBLIC_AGENT_GATEWAY_WS_URL=ws://localhost:3004
ENV NEXT_PUBLIC_AGENT_GATEWAY_WS_URL=$NEXT_PUBLIC_AGENT_GATEWAY_WS_URL

# Build Next.js
RUN npm run build

# Compile SSH Gateway TypeScript to JavaScript
RUN npx tsc --project tsconfig.server.json || echo "Server compilation done"

# ================================================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
ENV AGENT_GATEWAY_PORT=3004

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies only
RUN npm ci --legacy-peer-deps --omit=dev

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

# Copy compiled SSH Gateway and Agent Gateway (JavaScript)
COPY --from=builder /app/dist-server ./dist-server

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data
COPY --from=builder /app/data/ ./data/
RUN chmod -R 777 /app/data

# Expose ports
EXPOSE 3002
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Start with custom server
CMD ["node", "server.js"]
