FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run db:generate || true
RUN bun build ./src/index.ts --target bun --outdir ./dist

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src
COPY package.json ./

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
