FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/packages/types/node_modules packages/types/node_modules
COPY --from=deps /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=deps /app/apps/backend/node_modules apps/backend/node_modules
COPY packages/types packages/types
COPY packages/shared packages/shared
COPY apps/backend apps/backend
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
RUN pnpm --filter @concurso-ai/types build && \
    pnpm --filter @concurso-ai/shared build && \
    cd apps/backend && npx prisma generate && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
COPY --from=build /app/apps/backend/dist apps/backend/dist
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/apps/backend/node_modules apps/backend/node_modules
COPY --from=build /app/packages/types/dist packages/types/dist
COPY --from=build /app/packages/types/package.json packages/types/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/apps/backend/package.json apps/backend/package.json
COPY --from=build /app/node_modules node_modules
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads
USER appuser
EXPOSE 3333
WORKDIR /app/apps/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
