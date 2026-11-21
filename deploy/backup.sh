#!/bin/bash
# Nightly Postgres dump for the travel-al stack.
# Install with deploy/install-backup.sh; run manually any time to test.
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/travel-al/deploy}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/travel-al}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.hetzner.yml}"

mkdir -p "$BACKUP_DIR"
cd "$DEPLOY_DIR"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/travel-$stamp.sql.gz"
tmp="$target.partial"

# Dump to a temp name first so a crash never leaves a truncated file that
# looks like a usable backup.
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U travel -d travel --clean --if-exists \
  | gzip -9 > "$tmp"

# An empty or tiny file means pg_dump failed even if the pipeline exited 0.
size=$(stat -c%s "$tmp")
if [ "$size" -lt 1024 ]; then
  rm -f "$tmp"
  echo "backup failed: dump was only ${size} bytes" >&2
  exit 1
fi

mv "$tmp" "$target"
chmod 600 "$target"
find "$BACKUP_DIR" -name 'travel-*.sql.gz' -mtime "+$KEEP_DAYS" -delete

echo "backup ok: $target ($size bytes)"
