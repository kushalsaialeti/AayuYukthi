# AayuYukthi API (production)
FROM node:22-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# Install workspace deps for the server only (lean production image)
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
RUN npm ci --omit=dev --workspace=@aayuyukthi/server --include-workspace-root=false 2>/dev/null \
  || npm ci --omit=dev --workspace=server; \
  rm -rf /root/.npm

COPY server/src ./server/src
COPY server/scripts ./server/scripts
COPY migrations ./migrations

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 4000
WORKDIR /app/server

# Migrate on boot (tracked in schema_migrations; safe to re-run). Set
# SKIP_MIGRATE=1 when migrations run as a separate init step instead.
CMD ["sh", "-c", "if [ \"$SKIP_MIGRATE\" != \"1\" ]; then node src/database/migrate.js; fi; node src/server.js"]
