#!/bin/bash
# Installs the nightly database backup as a systemd timer. Run as root.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/travel-al}"

cat > /etc/systemd/system/travel-al-backup.service <<EOF
[Unit]
Description=travel-al database backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=${APP_DIR}/deploy/backup.sh
EOF

cat > /etc/systemd/system/travel-al-backup.timer <<'EOF'
[Unit]
Description=Nightly travel-al database backup

[Timer]
OnCalendar=*-*-* 03:20:00
RandomizedDelaySec=600
Persistent=true

[Install]
WantedBy=timers.target
EOF

chmod +x "${APP_DIR}/deploy/backup.sh"
systemctl daemon-reload
systemctl enable --now travel-al-backup.timer
systemctl list-timers travel-al-backup.timer --no-pager
