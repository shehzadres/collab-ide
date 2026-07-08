# ── Builder stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
# prisma/ must be present before npm ci so the postinstall `prisma generate`
# can locate the schema. The CLI is in devDependencies and available here.
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tini openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# --ignore-scripts skips the postinstall `prisma generate` — the CLI is in
# devDependencies and is absent here. We copy the already-generated client
# from the builder stage instead, which is correct and faster.
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
# Copy the generated Prisma client produced in the builder stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
