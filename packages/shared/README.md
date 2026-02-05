# @finplan/shared

Shared validation schemas and types for the FinPlan monorepo.

## Overview

This package provides a **single source of truth** for validation logic and types that are used across both the backend and frontend applications. By centralizing validation schemas using Zod, we ensure that frontend and backend validations never fall out of sync.

## Benefits

- ✅ **Single Source of Truth**: Define validation once, use everywhere
- ✅ **Type Safety**: Automatic TypeScript types inferred from Zod schemas
- ✅ **Consistent Validation**: Same rules on frontend and backend
- ✅ **Better DX**: Changes to validation automatically propagate to both apps
- ✅ **Reduced Bugs**: No more drift between frontend/backend validations

## Installation

The package is automatically linked in the monorepo via workspace dependencies.

**Backend** (`apps/backend/package.json`):
```json
{
  "dependencies": {
    "@finplan/shared": "*"
  }
}
```

**Frontend** (`apps/frontend/package.json`):
```json
{
  "dependencies": {
    "@finplan/shared": "*"
  }
}
```

## Usage

### Backend (Fastify Routes)

```typescript
import { createTransactionSchema, updateTransactionSchema } from '@finplan/shared';

export async function transactionRoutes(fastify: FastifyInstance) {
  fastify.post('/transactions', async (request, reply) => {
    // Validate request body using shared schema
    const validatedData = createTransactionSchema.parse(request.body);
    
    // Use validatedData (fully typed!)
    const transaction = await transactionService.createTransaction(userId, validatedData);
    
    return reply.status(201).send({ transaction });
  });
}
```

### Frontend (Forms & Types)

```typescript
import type { CreateTransactionInput, TransactionType } from '@finplan/shared';
import { createTransactionSchema } from '@finplan/shared';

// Use the type for your form state
const [formData, setFormData] = useState<CreateTransactionInput>({
  accountId: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  amount: 0,
  type: 'expense',
  name: '',
  // ... other fields
});

// Optionally validate on the client-side too
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Client-side validation (optional but recommended)
    const validated = createTransactionSchema.parse(formData);
    
    // Submit to backend
    createMutation.mutate(validated);
  } catch (error) {
    // Handle validation errors
    console.error('Validation failed:', error);
  }
};
```

## Available Schemas

### Transaction Schemas

```typescript
import {
  createTransactionSchema,
  updateTransactionSchema,
  TransactionTypeEnum,
  RecurrenceTypeEnum,
  type TransactionType,
  type RecurrenceType,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@finplan/shared';
```

**Create Transaction:**
- `accountId`: UUID (required)
- `date`: string or Date (required)
- `amount`: positive number (required)
- `type`: 'income' | 'expense' | 'transfer' (required)
- `name`: non-empty string (required)
- `categoryId`: UUID (optional)
- `subcategoryId`: UUID (optional)
- `description`: string (optional)
- `memo`: string (optional)
- `tags`: string[] (optional)
- `recurrence`: RecurrenceType (optional)
- `recurrence_end_date`: string (optional - leave blank for indefinite)
- `metadata`: Record<string, any> (optional)

### Account Schemas

```typescript
import {
  createAccountSchema,
  updateAccountSchema,
  AccountTypeEnum,
  type AccountType,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@finplan/shared';
```

**Account Types:**
- `current`, `savings`, `isa`, `stocks_and_shares_isa`, `credit`, `investment`, `loan`, `asset`, `liability`

### Category Schemas

```typescript
import {
  createCategorySchema,
  updateCategorySchema,
  CategoryTypeEnum,
  type CategoryType,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@finplan/shared';
```

## Development

### Building the Package

```bash
cd packages/shared
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Making Changes

1. Update the schema in `packages/shared/src/schemas/`
2. Run `npm run build` to rebuild the package
3. Both frontend and backend will automatically use the updated validation

**Important**: After making changes to schemas, you may need to restart the dev servers for the changes to be reflected.

## Architecture

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── transaction.schemas.ts  # Transaction validation
│   │   ├── account.schemas.ts      # Account validation
│   │   ├── category.schemas.ts     # Category validation
│   │   └── index.ts                # Re-exports
│   └── index.ts                     # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Best Practices

1. **Always update schemas here first** - Don't duplicate validation logic in apps
2. **Build after changes** - Run `npm run build` after schema updates
3. **Use types, not just schemas** - Import types for TypeScript support
4. **Test validation** - Schema changes affect both apps, so test thoroughly
5. **Document requirements** - Add JSDoc comments for complex validations

## Troubleshooting

### "Cannot find module '@finplan/shared'"

1. Ensure you've run `npm install` in the root directory
2. Build the shared package: `cd packages/shared && npm run build`
3. Restart your dev server

### Type errors after updating schemas

1. Rebuild the shared package: `cd packages/shared && npm run build`
2. Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server")

### Changes not reflecting

1. Rebuild shared package
2. Clear any build caches
3. Restart dev servers for both frontend and backend

## Future Enhancements

- Add runtime validation helpers for common patterns
- Add schema composition utilities
- Add custom error formatting
- Consider adding react-hook-form resolvers
