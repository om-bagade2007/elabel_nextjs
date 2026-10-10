# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Build tools for native modules (bcrypt)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time; .env is dockerignored so they come in as build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN test -n "$VITE_SUPABASE_URL" -a -n "$VITE_SUPABASE_ANON_KEY" || (echo "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY build args are required" && exit 1)
RUN NODE_ENV=production npm run build && npm prune --omit=dev

# Production stage: built app + runtime deps only (no compilers), runs as non-root
FROM node:20-slim AS production
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
RUN mkdir -p uploads && chown node:node uploads

ENV NODE_ENV=production HOST=0.0.0.0 PORT=5000
EXPOSE 5000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
