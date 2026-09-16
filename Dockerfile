# ---- Toss Book production image ----
# Build:  docker build -t tossbook .
# Run:    docker run -d -p 3000:3000 \
#           -e ADMIN_USERNAME=youradmin -e ADMIN_PASSWORD='a-strong-password' \
#           -v tossbook_data:/app/data --name tossbook tossbook

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# build tools in case better-sqlite3 has no prebuilt binary for the platform
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# ca-certificates for TLS to S3-compatible storage; Litestream for continuous
# SQLite backup/restore (keeps data across redeploys without a persistent disk).
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz && rm /tmp/litestream.tar.gz

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY litestream.yml /etc/litestream.yml
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && mkdir -p /app/data
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
