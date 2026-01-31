# ================================================================
# Sentry Dashboard - Multi-stage Dockerfile
# With SSH Gateway Support
# ================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies (--legacy-peer-deps for React 19 compatibility)
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

# Build the Next.js application
RUN npm run build

# Compile SSH Gateway TypeScript to JavaScript
RUN npx tsc server/ssh-gateway.ts server/sftp-handler.ts --outDir server --esModuleInterop --module commonjs --target es2020 --skipLibCheck --resolveJsonModule || true

# ================================================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for SSH
RUN apk add --no-cache openssh-client

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy custom server.js (our production server)
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

# Copy SSH Gateway compiled files
COPY --from=builder --chown=nextjs:nodejs /app/server/*.js ./server/

# Copy node_modules needed for SSH (ssh2, ws)
COPY --from=builder /app/node_modules/ssh2/ ./node_modules/ssh2/
COPY --from=builder /app/node_modules/ws/ ./node_modules/ws/

# Create data directory with full permissions for write access
RUN mkdir -p /app/data && chmod 777 /app/data
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
RUN chmod -R 777 /app/data

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application with custom server
CMD ["node", "server.js"]
