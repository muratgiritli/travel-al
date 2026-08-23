#!/bin/bash
set -euo pipefail

# Run as root on a fresh Ubuntu 24.04 Hetzner box.
REPO_URL="${REPO_URL:-https://github.com/muratgiritli/travel-al.git}"
APP_DIR="${APP_DIR:-/opt/travel-al}"
BRANCH="${BRANCH:-main}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR/deploy"
if [ ! -f .env ]; then
  umask 077
  cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
SESSION_SECRET=$(openssl rand -hex 48)
ADMIN_PASSWORD=$(openssl rand -hex 16)
OPENAI_API_KEY=${OPENAI_API_KEY:-}
MAX_HISTORY_MESSAGES=20
EOF
  echo "Wrote $APP_DIR/deploy/.env (admin password is in that file)"
fi

docker compose up -d --build
docker compose ps
echo "App should be on http://$(curl -fsS https://ifconfig.me || hostname -I | awk '{print $1}')/"
