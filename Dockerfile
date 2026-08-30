FROM node:22-bookworm-slim

WORKDIR /app

ARG DEBIAN_MIRROR=mirrors.aliyun.com

RUN sed -i \
  -e "s@deb.debian.org/debian-security@${DEBIAN_MIRROR}/debian-security@g" \
  -e "s@deb.debian.org/debian@${DEBIAN_MIRROR}/debian@g" \
  -e "s@security.debian.org/debian-security@${DEBIAN_MIRROR}/debian-security@g" \
  /etc/apt/sources.list.d/debian.sources \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
  && npm ci --include=dev \
  && npm cache clean --force

COPY backend ./backend
COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/app/data/forgeboard.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start:api"]
