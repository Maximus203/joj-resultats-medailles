# Image de l'API JOJ. Contexte de build = racine du dépôt (le workspace pnpm et
# packages/shared en font partie) :  docker build -f apps/api/Dockerfile .
#
# @joj/shared est publié en TypeScript brut : Node 24 le lit directement (retrait des types) tant
# que le paquet reste hors de node_modules. On conserve donc le layout du monorepo dans l'image
# (pas de `pnpm deploy`, qui copierait shared dans node_modules et casserait ce chargement).

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter "@joj/api..." --ignore-scripts=false
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN mkdir -p apps/api/data && pnpm --filter @joj/api build

FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod --filter "@joj/api..."

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
COPY apps/api/migrations ./apps/api/migrations
COPY apps/api/scripts ./apps/api/scripts
COPY --from=build /app/apps/api/data ./apps/api/data
COPY --from=build /app/apps/api/dist ./apps/api/dist
RUN chown -R node:node /app
USER node
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/main.js"]
