import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(
      (val) => {
        if (process.env.NODE_ENV === 'production') {
          // Reject example/weak secrets in production
          const weakSecrets = [
            'your-super-secret',
            'change-this',
            'example',
            'test',
            'development',
            'password',
            'secret',
          ];
          return !weakSecrets.some((weak) => val.toLowerCase().includes(weak));
        }
        return true;
      },
      {
        message:
          'JWT_SECRET must be a strong random string in production. Generate with: openssl rand -base64 64',
      }
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .refine(
      (val) => {
        if (process.env.NODE_ENV === 'production') {
          // Reject example/weak secrets in production
          const weakSecrets = [
            'your-super-secret',
            'change-this',
            'example',
            'test',
            'development',
            'password',
            'secret',
          ];
          return !weakSecrets.some((weak) => val.toLowerCase().includes(weak));
        }
        return true;
      },
      {
        message:
          'JWT_REFRESH_SECRET must be a strong random string in production. Generate with: openssl rand -base64 64',
      }
    ),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cookie Security
  COOKIE_SECRET: z.string().min(32),

  // CSRF Protection
  CSRF_SECRET: z.string().min(32).optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_TIME_WINDOW: z.string().default('15m'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const config = validateEnv();
