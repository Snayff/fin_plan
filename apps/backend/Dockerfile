FROM oven/bun:1-alpine

WORKDIR /workspace

# Copy workspace-level config (layer cache: these change rarely)
COPY package.json bun.lock ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy shared package
COPY packages/shared ./packages/shared/

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Copy prisma schema BEFORE bun install
# The postinstall hook runs `prisma generate`, which needs the schema
COPY apps/backend/prisma ./apps/backend/prisma/

# Install all deps; postinstall runs `prisma generate` automatically
# --production=false ensures devDeps (prisma CLI) are installed even if
# NODE_ENV=production is injected by the build environment
RUN bun install --production=false

# Switch to backend dir for remaining COPY steps
WORKDIR /workspace/apps/backend

# Copy backend source code
COPY apps/backend/src ./src/
COPY apps/backend/tsconfig.json ./

EXPOSE 3001

# At startup: migrate the database (idempotent), then start the server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/server.ts"]
