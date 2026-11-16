# Studio as a container image: the built single-page app, served by nginx.
#
# Build from the repository root (VITE_PLATFORM_URL is required; it is baked into the JavaScript):
#   docker build --build-arg VITE_PLATFORM_URL=https://platform.130-61-158-79.sslip.io -t studio .
#   docker run --rm -p 8080:8080 studio        # then open http://localhost:8080
#
# The build stage always runs on the build machine's own CPU: its output (HTML, JS, CSS) is the same
# for every CPU, so only the small nginx stage differs between amd64 and arm64.

# 1. Build the app
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is cached while only the source changes.
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .
# The base URL of the Platform API, for example https://platform.130-61-158-79.sslip.io.
ARG VITE_PLATFORM_URL
RUN test -n "$VITE_PLATFORM_URL" || (echo "VITE_PLATFORM_URL build argument is required" >&2; exit 1)
ENV VITE_PLATFORM_URL=$VITE_PLATFORM_URL
# Optional, baked in the same way: the footer's Docs link and the Contact address (see README, Configuration).
ARG VITE_DOCS_URL=""
ARG VITE_SUPPORT_EMAIL=""
ENV VITE_DOCS_URL=$VITE_DOCS_URL VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL
RUN npm run build

# 2. Serve it: nginx running as a non-root user on port 8080
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
