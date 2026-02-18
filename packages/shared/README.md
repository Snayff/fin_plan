# FinPlan: Run Locally with Docker in 10 Minutes

## What You'll Do

- Open the FinPlan frontend at `http://localhost:3000`
- Reach the backend API at `http://localhost:3001`
- Run the full local stack: frontend + backend + Postgres + Redis

## Prerequisites

- Git
- Docker Desktop (installed and running)
- Bun (optional, only for script shortcuts like `bun run start`)

## 1) Clone the Repo

### Bun Script Path (Recommended)

```bash
git clone https://github.com/Snayff/fin_plan.git
cd fin_plan
```

### Docker Compose Fallback

```bash
git clone https://github.com/Snayff/fin_plan.git
cd fin_plan
```

## 2) Build Docker Images

### Bun Script Path (Recommended)

```bash
bun run docker:build
```

### Docker Compose Fallback

```bash
docker compose -f docker-compose.dev.yml build
```

If `docker compose` is unavailable on your machine, use `docker-compose` instead.

## 3) Start the Stack

### Bun Script Path (Recommended)

```bash
bun run start
```

### Docker Compose Fallback

```bash
docker compose -f docker-compose.dev.yml up -d
```

## 4) Initialize the Database (Required)

### Bun Script Path (Recommended)

```bash
bun run db:migrate
bun run db:seed
```

### Docker Compose Fallback

```bash
docker compose -f docker-compose.dev.yml exec backend bun run db:migrate
docker compose -f docker-compose.dev.yml exec backend bun run db:seed
```

## 5) Verify It's Running

1. Open `http://localhost:3000` in your browser.
2. Open `http://localhost:3001/health`.
3. You should see JSON that includes `"status":"ok"` (with timestamp/uptime fields).

## Daily Commands

| Task | Bun command (primary) | Docker Compose fallback |
| --- | --- | --- |
| Start | `bun run start` | `docker compose -f docker-compose.dev.yml up -d` |
| Stop | `bun run stop` | `docker compose -f docker-compose.dev.yml down` |
| Restart | `bun run restart` | `docker compose -f docker-compose.dev.yml restart` |
| Logs | `bun run docker:logs` | `docker compose -f docker-compose.dev.yml logs -f` |
| Rebuild images | `bun run docker:build` | `docker compose -f docker-compose.dev.yml build` |
| Clean/reset (removes volumes and local DB data) | `bun run docker:clean` | `docker compose -f docker-compose.dev.yml down -v` |
| Run migrations | `bun run db:migrate` | `docker compose -f docker-compose.dev.yml exec backend bun run db:migrate` |
| Seed database | `bun run db:seed` | `docker compose -f docker-compose.dev.yml exec backend bun run db:seed` |

## Troubleshooting

### 1) Docker daemon not running

Start Docker Desktop, wait until it's fully up, then retry `bun run start` (or the compose `up` command).

### 2) Port already in use

Another process is using `3000`, `3001`, `5432`, or `6379`. Stop conflicting processes, then restart the stack.

### 3) DB schema errors

Run database setup again in order:

```bash
bun run db:migrate
bun run db:seed
```

### 4) Hot reload not updating

Restart containers:

```bash
bun run docker:restart
```

Or restart services with Docker Compose.

## About @finplan/shared (for contributors)

`@finplan/shared` is the monorepo package that centralizes Zod schemas and shared TypeScript types used by both backend and frontend so validation stays consistent across the stack.

```typescript
import { createTransactionSchema, type CreateTransactionInput } from '@finplan/shared';
```

Schemas live in `packages/shared/src/schemas`.

When you change shared schemas, rebuild this package:

```bash
cd packages/shared && bun run build
```

## More Docs

- [Quick Start](../../QUICK_START.md)
- [Docker Setup](../../docs/4.%20build/DOCKER_SETUP.md)
- [Prisma Docker Guide](../../docs/4.%20build/PRISMA_DOCKER_GUIDE.md)
