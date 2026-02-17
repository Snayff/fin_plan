# Prisma Client and Docker: Common Issues and Solutions

## The Problem

When using Prisma with Docker in development mode, you may encounter errors like:

```
The column `accounts.balance` does not exist in the current database.
```

Even though the column doesn't exist in your schema and shouldn't exist.

### Root Cause

The issue occurs because of how Docker volumes work:

1. **Docker Volume for node_modules**: The `docker-compose.dev.yml` uses a named volume for `/workspace/node_modules` to improve performance
2. **Prisma Client Location**: The Prisma client is generated into `node_modules/@prisma/client` and `node_modules/.prisma/client`
3. **Out of Sync**: When you modify the Prisma schema and regenerate the client on your host machine, the Docker container still uses the old client from its volume

## Solutions

### Solution 1: Use the Helper Script (Recommended)

We've created helper scripts that automatically fix this issue:

**Windows:**
```bash
regenerate-prisma-docker.bat
```

**Linux/Mac:**
```bash
chmod +x regenerate-prisma-docker.sh
./regenerate-prisma-docker.sh
```

These scripts will:
1. Regenerate the Prisma client inside the Docker container
2. Restart the backend service
3. Verify everything is working

### Solution 2: Manual Steps

If you need to fix it manually:

```bash
# Step 1: Regenerate Prisma client inside Docker container
docker-compose -f docker-compose.dev.yml exec backend bunx prisma generate

# Step 2: Restart the backend service
docker-compose -f docker-compose.dev.yml restart backend

# Step 3: Check the logs to ensure it's working
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Solution 3: Rebuild the Container

If the above solutions don't work, you may need to rebuild:

```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Rebuild the backend container (this takes longer)
docker-compose -f docker-compose.dev.yml build --no-cache backend

# Start everything again
docker-compose -f docker-compose.dev.yml up -d
```

## Prevention

### Automatic Regeneration

The backend `package.json` now includes a `postinstall` script that automatically regenerates the Prisma client:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This means whenever you run `bun install` (even inside Docker), the Prisma client will be regenerated automatically.

### When to Regenerate

You need to regenerate the Prisma client whenever you:

- ✅ Modify the `schema.prisma` file
- ✅ Run a new migration
- ✅ Pull changes that include schema updates
- ✅ Switch branches with different schema versions

### Development Workflow

**Best Practice Workflow:**

1. Make changes to `apps/backend/prisma/schema.prisma`
2. Create and run migration (optional for dev):
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev --name your_migration_name
   ```
3. Run the helper script to regenerate Prisma client:
   ```bash
   # Windows
   regenerate-prisma-docker.bat
   
   # Linux/Mac
   ./regenerate-prisma-docker.sh
   ```
4. Continue development

## Common Scenarios

### Scenario 1: Schema Changed on Main Branch

You pull changes from main and the schema has changed:

```bash
git pull origin main
./regenerate-prisma-docker.bat  # or .sh for Linux/Mac
```

### Scenario 2: Creating a New Migration

```bash
# Create migration inside Docker
docker-compose -f docker-compose.dev.yml exec backend bunx prisma migrate dev --name add_new_feature

# Regenerate client
./regenerate-prisma-docker.bat  # or .sh
```

### Scenario 3: Fresh Start

Starting fresh or having persistent issues:

```bash
# Complete reset
docker-compose -f docker-compose.dev.yml down -v  # -v removes volumes
docker-compose -f docker-compose.dev.yml up -d
```

⚠️ **Warning**: Using `-v` will delete all data in your development database!

## Troubleshooting

### Issue: "Column does not exist" error

**Solution**: Run `regenerate-prisma-docker.bat` or `.sh`

### Issue: Script fails with "container not running"

**Solution**: 
```bash
docker-compose -f docker-compose.dev.yml up -d
# Wait a few seconds, then try again
```

### Issue: Changes still not taking effect

**Solution**: Try a full rebuild
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache backend
docker-compose -f docker-compose.dev.yml up -d
```

### Issue: Database migrations not applied

**Solution**: Run migrations inside Docker
```bash
docker-compose -f docker-compose.dev.yml exec backend bunx prisma migrate deploy
```

## Technical Details

### Why Named Volumes?

Docker named volumes are used for `node_modules` to:
- Improve performance (especially on Windows/Mac)
- Prevent host OS file system differences from causing issues
- Speed up container startup

### Why This Causes Issues with Prisma

Prisma generates TypeScript types based on your schema. These are stored in:
- `node_modules/@prisma/client/index.d.ts` (TypeScript types)
- `node_modules/.prisma/client/` (Generated code)

When the schema changes but these files don't update, you get type mismatches and database errors.

### Alternative: No Named Volume (Not Recommended)

You could remove the named volume from `docker-compose.dev.yml`:

```yaml
# volumes:
#   - backend_node_modules:/workspace/node_modules  # Remove this
```

**However**, this will:
- ❌ Significantly slow down development (especially on Windows/Mac)
- ❌ Cause more issues than it solves
- ❌ Make bun installs inside Docker painfully slow

## Summary

**Remember these two commands:**

```bash
# Quick fix (after schema changes)
./regenerate-prisma-docker.bat  # Windows
./regenerate-prisma-docker.sh   # Linux/Mac

# Nuclear option (if nothing else works)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

When in doubt, use the helper scripts! They're designed to handle the most common issues automatically.
