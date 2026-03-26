# Architecture Documentation

Entry point for all architecture and pattern docs. Start here.

## System Docs — what exists and why

| Doc                                                    | Read when                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| [architecture.md](architecture.md)                     | Understanding the stack, layering pattern, or shared contract |
| [auth-session-lifecycle.md](auth-session-lifecycle.md) | Working on auth, sessions, or token refresh behaviour         |
| [deployment.md](deployment.md)                         | Working on CI/CD, or rotating deploy credentials              |

## Testing — adding or understanding tests

| Doc                                                          | Read when                             |
| ------------------------------------------------------------ | ------------------------------------- |
| [testing/\_testing_readme.md](../testing/_testing_readme.md) | Adding tests or choosing a test layer |

## Pattern Docs — how to build new things

| Doc                                                           | Read when                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| [patterns/form-validation.md](../patterns/form-validation.md) | Building or reviewing any form that submits data                    |
| [patterns/performance.md](../patterns/performance.md)         | Building dashboard aggregates, caching, or reviewing query patterns |

## Troubleshooting

| Doc                                                       | Read when                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| [troubleshooting/auth.md](../troubleshooting/auth.md)     | Diagnosing session, token, or redirect issues in production or dev      |
| [troubleshooting/docker.md](../troubleshooting/docker.md) | Diagnosing Docker/Prisma client sync issues, port conflicts, hot reload |
