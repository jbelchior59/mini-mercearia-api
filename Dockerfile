FROM node:20-bookworm-slim

WORKDIR /app

ENV DATABASE_URL=file:/data/dev.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY seed ./seed
COPY public ./public

RUN npm run build

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npm run docker:bootstrap && npm start"]
