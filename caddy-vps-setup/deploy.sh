#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/carnivalshowcase"
SERVICE_NAME="carnivalshowcase"

cd "$APP_DIR"
git pull origin main --rebase
npm install
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl reload caddy
echo "Deploy complete."
