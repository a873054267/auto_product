FROM node:22-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

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
