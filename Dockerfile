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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
RUN mkdir -p /app/data
# The SQLite database lives here — mount a volume so it persists across restarts.
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "start"]
