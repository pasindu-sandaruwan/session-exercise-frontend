# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# The API URL is injected at RUNTIME (see docker-entrypoint.sh), not baked in.
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# SPA routing fallback (React Router) + static asset caching
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint writes /config.js from env vars on each start.
COPY docker-entrypoint.sh /docker-entrypoint.d/99-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/99-runtime-config.sh

EXPOSE 80
# nginx:alpine already runs scripts in /docker-entrypoint.d/ before starting.
CMD ["nginx", "-g", "daemon off;"]
