#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "Applying database schema..."
pnpm --filter @workspace/db run push

echo "Starting API + web on port ${PORT:-8080}"
exec node --enable-source-maps /app/artifacts/api-server/dist/index.mjs
