# 🚀 Quick Start Guide - Docker Development

## TL;DR

```bash
# First time only: Build containers (2-5 minutes)
npm run docker:build

# Start everything
npm run start

# Open browser: http://localhost:3000
# Backend API: http://localhost:3001
```

That's it! All services (frontend, backend, database, cache) are now running.

---

## Daily Workflow

### Start Your Day
```bash
npm run start
```
Wait ~10 seconds. Everything starts automatically!

### Make Code Changes
Just edit files in:
- `apps/frontend/src` - Frontend changes
- `apps/backend/src` - Backend changes

Changes **auto-reload** - no restart needed! 🔥

### View Logs (If Something Breaks)
```bash
npm run docker:logs
```

### End Your Day
```bash
npm run stop
```

---

## Common Commands

| What You Want | Command |
|---------------|---------|
| Start everything | `npm run start` |
| Stop everything | `npm run stop` |
| Restart everything | `npm run restart` |
| View logs | `npm run docker:logs` |
| Run migrations | `npm run db:migrate` |
| Seed database | `npm run db:seed` |
| Open Prisma Studio | `npm run db:studio` |
| Clean slate (reset all data) | `npm run docker:clean` |

---

## When to Rebuild

Rebuild if you change:
- ✅ `package.json` (added/removed dependencies)
- ✅ `Dockerfile.dev`
- ✅ `prisma/schema.prisma` (then also run migrations)

```bash
npm run docker:build
npm run restart
```

You **don't** need to rebuild for regular code changes!

---

## Troubleshooting

### "Port already in use"
Something else is using port 3000, 3001, or 5432.

**Fix:**
```bash
# Stop everything first
npm run stop

# Check what's running
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill that process, then:
npm run start
```

### "Docker daemon not running"
Docker Desktop isn't running.

**Fix:** Start Docker Desktop, wait for it to fully start (whale icon in tray), then:
```bash
npm run start
```

### Changes not showing up
Hot reload might have failed.

**Fix:**
```bash
npm run docker:restart
```

### Database errors / Prisma "column does not exist"
Database might not be initialized, or Prisma client is out of sync.

**Quick Fix:**
```bash
# Windows
regenerate-prisma-docker.bat

# Mac/Linux
./regenerate-prisma-docker.sh
```

**Alternative:**
```bash
npm run db:migrate
npm run db:seed
```

> 📖 **See [docs/4. build/PRISMA_DOCKER_GUIDE.md](docs/4.%20build/PRISMA_DOCKER_GUIDE.md)** for detailed Prisma troubleshooting

### Nothing works
Nuclear option - start fresh:

**Fix:**
```bash
npm run docker:clean
npm run docker:build
npm run start
npm run db:migrate
npm run db:seed
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 (run `npm run db:studio` first) |
| PostgreSQL | localhost:5432 (user: finplan, password: finplan_dev_password) |
| Redis | localhost:6379 |

---

## What's Running?

```bash
docker-compose -f docker-compose.dev.yml ps
```

You should see:
- ✅ finplan-postgres-dev (healthy)
- ✅ finplan-redis-dev (healthy)
- ✅ finplan-backend-dev (Up)
- ✅ finplan-frontend-dev (Up)

---

## Full Documentation

For detailed information, see: **[docs/4. build/DOCKER_SETUP.md](docs/4.%20build/DOCKER_SETUP.md)**

---

## Old Way vs New Way

**Before:**
```bash
# Terminal 1
docker-compose -f docker-compose.dev.yml up

# Terminal 2
cd apps/backend
npm run dev

# Terminal 3
cd apps/frontend
npm run dev

# Close all terminals when done 😫
```

**Now:**
```bash
npm run start
# ...
npm run stop
# Done! 😎
```

---

**Questions?** Check [docs/4. build/DOCKER_SETUP.md](docs/4.%20build/DOCKER_SETUP.md) for troubleshooting and advanced usage.
