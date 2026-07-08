# ── Builder stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
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

# --ignore-scripts skips postinstall (prisma generate) — the CLI is a
# devDependency and absent here. We copy the fully-generated output from
# the builder instead.
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled app and the generated Prisma client from the builder.
# Both copies happen before USER so the non-root user can read them.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
