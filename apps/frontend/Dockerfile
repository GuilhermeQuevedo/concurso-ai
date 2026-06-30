FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/packages/types/node_modules packages/types/node_modules
COPY --from=deps /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=deps /app/apps/frontend/node_modules apps/frontend/node_modules
COPY packages/types packages/types
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
RUN pnpm --filter @concurso-ai/types build && \
    pnpm --filter @concurso-ai/shared build && \
    pnpm --filter @concurso-ai/frontend build

FROM nginx:alpine AS runner
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
