# syntax=docker/dockerfile:1
# Stage 1: build the Puter apps (pinned upstream ref), rewritten to run on the local shim.
FROM node:22-bookworm AS suite
ARG UPSTREAM_REF=e4b187b39ef1b7094948bf1794c1a5de66e27a80
ENV UPSTREAM_REF=${UPSTREAM_REF}
RUN apt-get update && apt-get install -y --no-install-recommends python3 git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY suite ./suite
RUN bash suite/build.sh /build/upstream /build/dist

# Stage 2: runtime, no dependencies, non-root.
FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data SUITE_DIR=/srv/suite
RUN apk add --no-cache ffmpeg libheif-tools font-noto font-noto-emoji ttf-freefont python3 openssh-client bash
WORKDIR /srv/app
COPY package.json ./
COPY server ./server
COPY web ./web
COPY suite/shim ./suite/shim
COPY --from=suite /build/dist /srv/suite
COPY UPSTREAM-LICENSE-MIT.txt ./
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s CMD wget -qO- "http://127.0.0.1:${PORT:-8080}/healthz" || exit 1
CMD ["node", "server/index.js"]
