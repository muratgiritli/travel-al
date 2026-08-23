FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

ENV PORT=5173
ENV BASE_PATH=/
RUN pnpm --filter @workspace/visa-assistant run build \
  && pnpm --filter @workspace/api-server run build

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/artifacts/visa-assistant/dist/public

EXPOSE 8080
ENTRYPOINT ["/bin/sh","/entrypoint.sh"]
