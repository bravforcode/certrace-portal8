FROM oven/bun:1.3.10 AS bun
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

# Schema-only image: no application source or generated Prisma client.
FROM base AS migrate
WORKDIR /app
COPY docker/migrate/package.json docker/migrate/bun.lock ./
RUN bun install --frozen-lockfile --production
COPY certrace-backend/prisma ./prisma
COPY certrace-backend/prisma.config.ts ./prisma.config.ts
ENV CHECKPOINT_DISABLE=1 PRISMA_HIDE_UPDATE_MESSAGE=1
USER node
CMD ["bun", "run", "migrate"]

FROM base AS runtime
WORKDIR /app
COPY package.json bun.lock ./
COPY certrace-backend/package.json certrace-backend/package.json
COPY certrace-portal/package.json certrace-portal/package.json
RUN bun install --frozen-lockfile --production --filter @certrace/backend
COPY certrace-backend/prisma certrace-backend/prisma
COPY certrace-backend/prisma.config.ts certrace-backend/prisma.config.ts
RUN bun run --cwd certrace-backend db:generate
COPY certrace-backend/src certrace-backend/src
# Cera shares the existing rule engine's maintained knowledge, without a copy.
COPY certrace-portal/lib/cera/knowledge-cbam.ts certrace-portal/lib/cera/knowledge-platform.ts certrace-portal/lib/cera/knowledge-types.ts certrace-portal/lib/cera/
COPY certrace-portal/lib/team-seat-limits.ts certrace-portal/lib/team-seat-limits.ts
COPY certrace-backend/scripts/migrate-report-data.ts certrace-backend/scripts/migrate-report-data.ts
WORKDIR /app/certrace-backend
USER node
EXPOSE 8000
CMD ["bun", "src/index.ts"]
