# Docker Troubleshooting

## Symptom: "column does not exist" after schema change

Prisma generates its client into `node_modules/.prisma/client`. Because `node_modules` is a Docker named volume, changing `schema.prisma` on the host doesn't update the client inside the container — the container keeps serving the old generated types.

**Fix:**

```bash
docker compose exec backend bunx prisma generate
docker compose restart backend
```

**Prevention:** Always run `bun run db:migrate` (not just `prisma generate`) after schema changes — the migrate command regenerates the client as part of its flow.

**When to regenerate manually:**

- You pulled changes that include a schema update
- You switched branches with a different schema version
- Migration ran but the backend still errors on the new fields

## Symptom: port already in use on startup

```bash
# Find what's holding the port (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Find what's holding the port (Mac/Linux)
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

Kill the conflicting process, or stop a previous compose session with `bun run stop`.

## Symptom: hot reload stopped working

```bash
# Restart the affected service
docker compose restart backend
docker compose restart frontend
```

If that doesn't help, a full restart usually does: `bun run restart`.

## Symptom: nothing works after dependency changes

Changing `package.json` requires a container rebuild — hot reload doesn't handle dependency installs.

```bash
docker compose build backend   # or frontend
bun run restart
```

## Nuclear option: full clean slate

Wipes all container data including the postgres volume — use only when everything else fails.

```bash
docker compose down -v
bun run start
```

Then re-run migrations: `bun run db:migrate` and seed: `bun run db:seed`.
