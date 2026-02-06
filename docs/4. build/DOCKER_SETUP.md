# Docker Development Setup

## Overview

The entire FinPlan development stack (frontend, backend, PostgreSQL, Redis) now runs in Docker containers, providing a consistent development environment and eliminating the need to manually start multiple terminals.

---

## 🎯 Benefits

✅ **Single Command Start/Stop** - No more juggling multiple terminal windows
✅ **Consistent Environment** - Same setup across all developer machines
✅ **Hot Reload** - Code changes automatically reflected (frontend & backend)
✅ **Isolated Dependencies** - Each service has its own node_modules
✅ **Easy Onboarding** - New developers can start in minutes
✅ **Production-Like** - Closer to actual deployment environment

---

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)

**Windows:**
```bash
# Start everything
.\start-dev.bat

# Stop everything
.\stop-dev.bat
```

**Mac/Linux:**
```bash
# Make scripts executable (first time only)
chmod +x start-dev.sh stop-dev.sh

# Start everything
./start-dev.sh

# Stop everything
./stop-dev.sh
```

### Option 2: Using NPM Scripts

```bash
# Start all services in background
npm run start

# Stop all services
npm run stop

# Restart all services
npm run restart

# View logs from all services
npm run docker:logs

# View logs from specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Option 3: Using Docker Compose Directly

```bash
# Start all services (attached mode - see logs)
docker-compose -f docker-compose.dev.yml up

# Start all services (detached mode - run in background)
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 📦 What's Included

The Docker Compose setup includes 4 services:

1. **PostgreSQL** (port 5432)
   - Database for application data
   - Persistent volume for data
   - Health checks

2. **Redis** (port 6379)
   - Cache and session store
   - Persistent volume for data
   - Health checks

3. **Backend** (port 3001)
   - Node.js API server
   - Hot reload on code changes
   - Auto-connects to PostgreSQL and Redis

4. **Frontend** (port 3000)
   - Vite dev server
   - Hot reload on code changes
   - Auto-connects to backend

---

## 🔧 First Time Setup

### Prerequisites

- **Docker Desktop** installed and running
  - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Linux: Install Docker Engine and Docker Compose

### Initial Build

The first time you run the services, Docker will build the images. This takes 2-5 minutes:

```bash
# Build all containers
npm run docker:build

# Or
docker-compose -f docker-compose.dev.yml build
```

After the initial build, starting/stopping is much faster (5-10 seconds).

---

## 🛠️ Common Tasks

### Running Database Migrations

```bash
# Run migrations (services must be running)
npm run db:migrate

# Or directly:
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate
```

### Seeding the Database

```bash
# Seed default categories
npm run db:seed

# Or directly:
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

### Accessing Prisma Studio

```bash
# Open Prisma Studio (runs on host, not in container)
npm run db:studio

# Opens at http://localhost:5555
```

### Viewing Logs

```bash
# All services
npm run docker:logs

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis
```

### Restarting Services

```bash
# Restart all services
npm run docker:restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend
```

### Rebuilding After Dependency Changes

If you add/update npm packages in `package.json`:

```bash
# Rebuild containers
npm run docker:build

# Or rebuild specific service
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml build frontend

# Then restart
npm run restart
```

### Clean Slate (Reset Everything)

```bash
# Stop and remove all data
npm run docker:clean

# Or
docker-compose -f docker-compose.dev.yml down -v

# Then start fresh
npm run start
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Error: "port is already in use"**
```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Mac/Linux:
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill the process or change the port in docker-compose.dev.yml
```

**Error: "Docker daemon not running"**
- Start Docker Desktop and wait for it to fully start
- Look for the whale icon in your system tray/menu bar

### Hot Reload Not Working

**Backend changes not reflecting:**
```bash
# Check if volume mounts are correct
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src

# Restart backend container
docker-compose -f docker-compose.dev.yml restart backend
```

**Frontend changes not reflecting:**
```bash
# Restart frontend container
docker-compose -f docker-compose.dev.yml restart frontend

# Or rebuild
docker-compose -f docker-compose.dev.yml build frontend
npm run restart
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose -f docker-compose.dev.yml ps

# Should show "healthy" status for postgres

# Check backend logs for connection errors
docker-compose -f docker-compose.dev.yml logs backend

# Verify DATABASE_URL is correct in docker-compose.dev.yml
```

### Node Modules Issues

If you get module not found errors:

```bash
# Rebuild with no cache
docker-compose -f docker-compose.dev.yml build --no-cache backend
docker-compose -f docker-compose.dev.yml build --no-cache frontend

# Restart
npm run restart
```

### Can't Connect to Frontend/Backend

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# All services should be "Up"

# Check if ports are exposed
docker-compose -f docker-compose.dev.yml port frontend 3000
docker-compose -f docker-compose.dev.yml port backend 3001

# Verify in browser:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health (should return OK)
```

---

## 📝 Environment Variables

Environment variables are defined in `docker-compose.dev.yml` for each service.

### Backend Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret (32+ chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (32+ chars)
- `CORS_ORIGIN` - Allowed CORS origin (frontend URL)
- `NODE_ENV` - Set to "development"

### Frontend Environment Variables

- `VITE_API_URL` - Backend API URL
- `NODE_ENV` - Set to "development"

**⚠️ Security Note:** The secrets in `docker-compose.dev.yml` are for development only. Use different, secure secrets in production!

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Host Machine (Your Computer)              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Docker Network: finplan-network    │   │
│  │                                     │   │
│  │  ┌──────────┐    ┌──────────┐      │   │
│  │  │ Frontend │    │ Backend  │      │   │
│  │  │  :3000   │───▶│  :3001   │      │   │
│  │  └──────────┘    └─────┬────┘      │   │
│  │                        │            │   │
│  │  ┌──────────┐    ┌─────▼──────┐    │   │
│  │  │  Redis   │    │ PostgreSQL │    │   │
│  │  │  :6379   │◀───│   :5432    │    │   │
│  │  └──────────┘    └────────────┘    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Volumes:                                   │
│  • postgres_data (persistent)               │
│  • redis_data (persistent)                  │
│  • backend_node_modules                     │
│  • frontend_node_modules                    │
│                                             │
│  Mounted Code (Hot Reload):                │
│  • ./apps/backend/src → backend            │
│  • ./apps/frontend/src → frontend          │
└─────────────────────────────────────────────┘
```

---

## 🔒 Security Considerations

### Development Environment

The Docker Compose setup is configured for **local development only**:
- Uses weak passwords (change for production!)
- Exposes all ports directly
- Runs containers as root (for convenience)
- No SSL/TLS

### Production Deployment

For production, you'll need:
- ✅ Strong, unique passwords and secrets
- ✅ SSL/TLS certificates
- ✅ Run containers as non-root user
- ✅ Use reverse proxy (nginx/Caddy)
- ✅ Limit exposed ports
- ✅ Enable security headers
- ✅ Use production-optimized Dockerfiles

---

## 💡 Tips & Best Practices

### Development Workflow

1. **Start your day:**
   ```bash
   npm run start
   # Wait ~10 seconds
   # Open http://localhost:3000
   ```

2. **Make changes:**
   - Edit files in `apps/frontend/src` or `apps/backend/src`
   - Changes auto-reload in browser/server

3. **View logs when debugging:**
   ```bash
   npm run docker:logs
   ```

4. **End your day:**
   ```bash
   npm run stop
   ```

### Performance Tips

- **Keep Docker Desktop running** - Starting/stopping Docker Desktop is slow
- **Use volume mounts** - Already configured for hot reload
- **Don't rebuild unnecessarily** - Only rebuild when dependencies change
- **Use `.dockerignore`** - Already configured to exclude node_modules, etc.

### When to Rebuild

Rebuild containers when:
- ✅ You add/remove npm packages
- ✅ You change `Dockerfile.dev`
- ✅ You change Prisma schema (then also run migrations)
- ❌ Not needed for regular code changes (hot reload handles it)

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🎉 Summary

**Old Workflow:**
```bash
Terminal 1: npm run docker:dev
Terminal 2: cd apps/backend && npm run dev
Terminal 3: cd apps/frontend && npm run dev
```

**New Workflow:**
```bash
npm run start
# Everything just works! 🚀
```

---

**Last Updated:** February 6, 2026
