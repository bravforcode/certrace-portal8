# Local builds include validation; CI selects ci only after required checks pass.
ARG FRONTEND_BUILD_MODE=checked
FROM oven/bun:1.3.10 AS bun
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY patches ./patches
COPY certrace-backend/package.json certrace-backend/package.json
COPY certrace-portal/package.json certrace-portal/package.json

FROM base AS dependencies
RUN bun install --frozen-lockfile

FROM dependencies AS checked
COPY certrace-backend/prisma certrace-backend/prisma
COPY certrace-backend/prisma.config.ts certrace-backend/prisma.config.ts
RUN bun run --cwd certrace-backend db:generate
COPY certrace-backend certrace-backend
COPY certrace-portal certrace-portal
RUN bun run --cwd certrace-backend db:report-catalogue
ENV CERTRACE_CI_CHECKS_PASSED=false

# Backend imports in the portal are type-only. Compilation needs neither its
# source nor Prisma once the separate CI type/contract checks have passed.
FROM base AS ci
# Build tooling lives in portal dependencies; test/lint/Cloudflare and backend
# dependencies are unnecessary after CI checks. Keep downloads out of the layer.
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --frozen-lockfile --production --filter certrace-portal
ENV CERTRACE_CI_CHECKS_PASSED=true

FROM ${FRONTEND_BUILD_MODE} AS build
COPY certrace-portal certrace-portal
ARG NEXT_PUBLIC_API_BASE_URL=/backend
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/certrace-portal
# Keep compiler data across source changes without adding it to image layers.
RUN --network=none --mount=type=cache,target=/app/certrace-portal/.next/cache,sharing=locked bun run build
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/certrace-portal/.next/standalone ./
COPY --from=build --chown=node:node /app/certrace-portal/.next/static ./certrace-portal/.next/static
COPY --from=build --chown=node:node /app/certrace-portal/public ./certrace-portal/public
USER node
EXPOSE 3000
CMD ["node", "certrace-portal/server.js"]
