#!/bin/sh
set -e

# Regenerate the runtime config from environment variables on every start,
# so one image can point at any backend. Pass vars via `docker run -e ...`
# or `--env-file .env`.
CONFIG_FILE=/usr/share/nginx/html/config.js

cat > "$CONFIG_FILE" <<EOF
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:3000}"
};
EOF

echo "[entrypoint] wrote $CONFIG_FILE with VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3000}"
