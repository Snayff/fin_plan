<div align="center">

<!-- Add logo: docs/assets/logo.png -->

# finplan

**See where your money goes. Feel confident it adds up.**

A household financial planning tool built around the waterfall model — income flows down through committed spend, discretionary spend, and into surplus. No bank connection required. No advice given. Just clear arithmetic and a calm interface for planning with intention.

[![Version](https://img.shields.io/badge/version-0.1.0-indigo)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](#)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-teal)](#license)

</div>

---

## About

Most budgeting tools track what you've spent. finplan is different — it tracks what you _plan_ to spend. You reconcile actual transactions with your bank separately; finplan holds the model of your financial life so you always know where you stand.

The app is built around a single mental model: the **waterfall**. Income flows in at the top. Committed spending — rent, subscriptions, utilities — comes off first. Then discretionary spending: gifts, purchases, experiences. What remains is your surplus, the money building toward your future. Every number on screen is a position in that cascade.

finplan is designed for UK households managing finances together. It's a desktop-first, dark-mode application with a deliberately calm aesthetic — no red/green scoring of financial choices, no anxiety-inducing alerts, no gamification. Just your plan, laid out clearly.

---

## Screenshots

<!-- Add screenshot: waterfall overview showing income → committed → discretionary → surplus cascade -->

<!-- Add screenshot: snapshot timeline showing financial history over time -->

---

## Features

### Overview

- Full waterfall cascade — income through committed, discretionary, and surplus tiers
- Review wizard for periodic plan updates
- Point-in-time snapshot history with timeline visualisation
- Financial summary panel with trend sparklines

### Spend Planning

- (Coming soon) Bills calendar with virtual pot accounting (yearly totals divided across months)
- (Coming soon) Gift planner — track upcoming gifts by person and occasion
- (Coming soon) Purchase planner — plan larger one-off purchases

### Surplus & Wealth

- Wealth accounts — net worth tracking by asset class
- ISA tracker
- (Coming soon) Trust savings tracker

### Household

- Multi-member household support
- Settings and profile management
- Audit log

---

## Self-Hosting

### Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) (installed and running)
- [Bun](https://bun.sh/) v1.0+
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Snayff/fin_plan.git
cd fin_plan

# 2. Configure environment variables
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — replace the JWT, cookie, and CSRF secrets at minimum
# Generate secrets with: openssl rand -base64 64

# 3. Build and start all services (Postgres, backend, frontend)
bun run docker:build
bun run start

# 4. Initialise the database (first run only)
bun run db:migrate
bun run db:seed

# 5. Open the app
# http://localhost:3000
```

To verify the backend is running: `http://localhost:3001/health` should return `{"status":"ok"}`.

To stop all services:

```bash
bun run stop
```

---

## Developer Reference

For full development context — architecture decisions, testing approach, conventions, and CI/CD — see [CLAUDE.md](.claude/CLAUDE.md).

### Key Commands

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `bun run start`        | Start all services via Docker Compose           |
| `bun run stop`         | Stop all services                               |
| `bun run restart`      | Stop and restart                                |
| `bun run docker:build` | Rebuild Docker images                           |
| `bun run docker:logs`  | Follow all service logs                         |
| `bun run docker:clean` | Remove containers and volumes (resets local DB) |
| `bun run dev`          | Run all apps in watch mode (outside Docker)     |
| `bun run test`         | Run all test suites                             |
| `bun run lint`         | ESLint — zero warnings required                 |
| `bun run type-check`   | TypeScript strict check across all packages     |
| `bun run db:migrate`   | Run interactive Prisma migration                |
| `bun run db:seed`      | Seed the database                               |

### Architecture

Full-stack TypeScript monorepo with a Fastify + Prisma + tRPC backend, React 18 + Vite + TanStack Query frontend, and shared Zod schemas in a `packages/shared` layer consumed by both apps. The Docker Compose environment provides Postgres; the backend runs on port 3001, the frontend on 3000.

```
apps/
  backend/    # Fastify · Prisma · tRPC · JWT auth
  frontend/   # React 18 · Vite · Tailwind · TanStack Query · Zustand · RxDB
packages/
  shared/     # Zod schemas and TypeScript types
```

---

## Tech Stack

TypeScript · React 18 · Vite · Tailwind CSS · Fastify · Prisma · tRPC · Bun · PostgreSQL · Docker

---

## License

Distributed under the GNU General Public License v3.0. See [license.txt](LICENSE.txt) for details.

---

## Acknowledgements

- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) — structural inspiration
- [Shadcn/ui](https://ui.shadcn.com/) — component primitives
- [TanStack](https://tanstack.com/) — Query and Router
- [Impeccable](https://impeccable.style/) - UI refinement
- [Superpowers](https://github.com/obra/superpowers) - Agents for SDLC workflow
