# Next Steps - Phase 1 Backend Implementation

## Immediate Next Steps

Phase 1 scaffolding is complete! To make the application functional, implement these backend components:

### 1. Create Backend Server (apps/backend/src/server.ts)

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env';
import { authRoutes } from './routes/auth.routes';

const server = Fastify({ logger: true });

// Register plugins
await server.register(cors, { origin: config.corsOrigin });
await server.register(helmet);
await server.register(rateLimit, { max: 100, timeWindow: '15 minutes' });

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });

// Health check
server.get('/health', async () => ({ status: 'ok' }));

// Start server
const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

### 2. Create Auth Service (apps/backend/src/services/auth.service.ts)

Implement:
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`
- `generateToken(userId: string): string`
- `verifyToken(token: string): { userId: string } | null`
- `createUser(email: string, password: string, name: string): Promise<User>`
- `findUserByEmail(email: string): Promise<User | null>`

### 3. Create Auth Routes (apps/backend/src/routes/auth.routes.ts)

Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (optional for JWT)
- `GET /api/auth/me` - Get current user (requires auth)

### 4. Create Database Seed (apps/backend/src/db/seed.ts)

Seed default categories:
```typescript
// Income categories
- Salary
- Dividends
- Gifts
- Refunds
- Other Income

// Expense categories
- Housing (Rent, Mortgage, Insurance, Repairs)
- Transportation (Fuel, Insurance, Maintenance, Public Transport)
- Food (Groceries, Dining Out)
- Utilities (Electricity, Water, Internet, Phone)
- Healthcare (Insurance, Medical, Dental)
- Entertainment (Streaming, Hobbies, Sports)
- Insurance (Life, Home, Auto)
- Debt Payments (Credit Card, Loans)
- Savings
- Other Expenses
```

### 5. Test the Flow

1. **Start services**:
   ```bash
   npm run docker:dev     # Start PostgreSQL + Redis
   cd apps/backend && npm run db:migrate  # Run migrations
   cd apps/backend && npm run db:seed     # Seed categories
   npm run dev            # Start frontend + backend
   ```

2. **Test registration**:
   - Navigate to http://localhost:3000/register
   - Create account
   - Verify user created in database

3. **Test login**:
   - Navigate to http://localhost:3000/login
   - Login with created account
   - Verify redirect to dashboard

4. **Test protected route**:
   - Verify dashboard shows user name
   - Logout and verify redirect to login

---

## File Creation Checklist

Create these files in order:

### Configuration
- [ ] `apps/backend/src/config/env.ts` - Environment validation
- [ ] `apps/backend/src/config/database.ts` - Prisma client export

### Utilities
- [ ] `apps/backend/src/utils/password.ts` - Bcrypt helpers
- [ ] `apps/backend/src/utils/jwt.ts` - JWT helpers
- [ ] `apps/backend/src/utils/errors.ts` - Custom error classes

### Services
- [ ] `apps/backend/src/services/auth.service.ts` - Auth business logic

### Routes
- [ ] `apps/backend/src/routes/auth.routes.ts` - Auth endpoints

### Middleware
- [ ] `apps/backend/src/middleware/auth.middleware.ts` - JWT verification
- [ ] `apps/backend/src/middleware/errorHandler.ts` - Error handling

### Database
- [ ] `apps/backend/src/db/seed.ts` - Seed script

### Main
- [ ] `apps/backend/src/server.ts` - Main entry point

---

## Quick Start Commands

```bash
# 1. Install all dependencies
npm install

# 2. Start Docker services
npm run docker:dev

# 3. Setup backend
cd apps/backend
copy .env.example .env
npx prisma generate
npm run db:migrate

# 4. Implement backend files (use checklist above)
# ... create the necessary files ...

# 5. Seed database
npm run db:seed

# 6. Start development
cd ../..
npm run dev

# 7. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

---

## Testing Endpoints

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User (with token)
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Phase 2 Preview

Once Phase 1 backend is complete, Phase 2 will add:

1. **Account Management**
   - Create/Read/Update/Delete accounts
   - Account types: checking, savings, investment, credit
   - Account balance tracking

2. **Transaction Management**
   - Manual transaction entry
   - Transaction list with filtering
   - Category assignment
   - Tag support

3. **Basic Dashboard**
   - Net worth calculation
   - Monthly income/expense totals
   - Recent transactions list
   - Account balance cards

4. **Recurring Transactions**
   - Recurring rule engine
   - Automatic transaction generation
   - Edit series or individual instances

See `docs/build/implementation.md` for complete Phase 2 details.
