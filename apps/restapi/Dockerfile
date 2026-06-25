# Production image for @mab/restapi (NestJS + Fastify + Puppeteer).
#
# IMPORTANT: build with the MONOREPO ROOT as context so the pnpm workspace
# files (pnpm-lock.yaml / pnpm-workspace.yaml) are available:
#
#   docker build -f apps/restapi/Dockerfile -t mab-restapi .
#
# Puppeteer (TSE scraping) needs a real Chrome + its system libraries. We let
# Puppeteer manage its own Chrome build (guaranteed version match with the
# library) and only install the runtime shared libs via apt in the final stage.

ARG NODE_VERSION=22
ARG PNPM_VERSION=11.1.3

# Stable, known location for the Chrome that Puppeteer downloads. It must match
# between the build stage (download) and the runner (lookup at runtime).
ARG PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer

# =============================================================================
# base — Node + pnpm (corepack), shared by build stages
# =============================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ARG PUPPETEER_CACHE_DIR
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR}
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# =============================================================================
# builder — install all deps, compile TS, then produce a self-contained
#           production bundle with a flat (symlink-free) node_modules.
# =============================================================================
FROM base AS builder

# `unzip` is required by @puppeteer/browsers to extract the Chrome download;
# it is absent from the -slim base image.
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy only the manifests first so the dependency layer is cached across
# source-only changes. restapi has no workspace (@mab/*) dependencies, so the
# focused filter pulls just what it needs.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/restapi/package.json apps/restapi/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @mab/restapi...

# Build the application (nest build -> dist/src/main.js)
COPY apps/restapi apps/restapi
RUN pnpm --filter @mab/restapi build

# Flatten into /app/out: real node_modules (prod only) + package.json + dist.
# `pnpm deploy` resolves the workspace symlinks into a portable tree.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm deploy --filter=@mab/restapi --prod --legacy /app/out

# Download the Chrome build Puppeteer expects into PUPPETEER_CACHE_DIR.
# (No-op if a prior install script already fetched it.)
RUN cd /app/out && node node_modules/puppeteer/install.mjs

# =============================================================================
# runner — minimal runtime: Chrome system libs + the bundled app
# =============================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ARG PUPPETEER_CACHE_DIR

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR}

WORKDIR /app

# Runtime shared libraries required by headless Chrome on Debian bookworm.
# tini gives us proper PID 1 signal handling / zombie reaping for Chrome procs.
RUN apt-get update && apt-get install -y --no-install-recommends \
        tini \
        ca-certificates \
        fonts-liberation \
        fonts-noto-color-emoji \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libexpat1 \
        libgbm1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libx11-6 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# App artifacts only — never the source tree (keeps .env and dev files out).
COPY --from=builder --chown=node:node /app/out/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/out/package.json ./package.json
COPY --from=builder --chown=node:node /app/apps/restapi/dist ./dist

# The Chrome binary downloaded by Puppeteer.
COPY --from=builder --chown=node:node ${PUPPETEER_CACHE_DIR} ${PUPPETEER_CACHE_DIR}

USER node
EXPOSE 3000

# Liveness probe (global prefix "api" + URI version "1").
# HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
#     CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/src/main.js"]
