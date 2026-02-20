FROM node:20-slim AS base

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @gov-epub/core run build

# --- Development target ---
FROM base AS dev
EXPOSE 3000 3001
CMD ["pnpm", "dev"]

# --- Production build ---
FROM base AS build
RUN pnpm --filter @gov-epub/api run build && pnpm --filter @gov-epub/web run build

FROM node:20-slim AS production
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/core/package.json ./packages/core/
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/api/package.json ./packages/api/
COPY --from=build /app/packages/web/.next ./packages/web/.next
COPY --from=build /app/packages/web/public ./packages/web/public
COPY --from=build /app/packages/web/package.json ./packages/web/
COPY --from=build /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/fixtures ./fixtures

EXPOSE 3000 3001
CMD ["node", "packages/api/dist/server.js"]
