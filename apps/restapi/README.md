# @mab/restapi

REST API for the MAB project, built with NestJS + Fastify.

## Stack

- **Framework**: NestJS + Fastify
- **Database**: PostgreSQL via Drizzle ORM
- **Cache**: Redis (ioredis)
- **Authentication**: Keycloak (JWT via `jose` & @keycloak/keycloak-admin-client)

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Database config
DATABASE_URL=postgresql://mab:mab@localhost/mab
REDIS_URL=redis://:mab@localhost:6379

# Keycloak config
KC_BASE_URL=http://localhost:8080
KC_REALM=mab
KC_HEALTH_URL=http://localhost:9000/health
KC_REST_API_AUDIENCE=restapi

## Oauth2

### clients config (admin-dashboard & KC admin realm-management)
KC_ADMIN_CLIENT_ID=restapi
KC_ADMIN_CLIENT_SECRET=

### clients config (mobile-app)
KC_MOBILE_CLIENT_ID=mobile
```

## Local development

Requires infrastructure services running (see `docker/local/docker-compose.yml`):

```bash
# Start infrastructure
docker compose -f docker/local/docker-compose.yml up -d

# Install dependencies (from monorepo root)
pnpm install

# Run in watch mode
pnpm --filter @mab/restapi dev

# Or if you want to use turbo with cache/tui directly:

pnpm dev --filter @mab/restapi
```

## Authentication

All endpoints are private by default. The `HybridAuthGuard` supports two strategies:

| Strategy   | How the token is sent                  | Expected Keycloak client         |
| ---------- | -------------------------------------- | -------------------------------- |
| **Cookie** | `access_token` cookie                  | `KC_ADMIN_CLIENT_ID` (dashboard) |
| **Bearer** | `Authorization: Bearer <token>` header | `KC_MOBILE_CLIENT_ID` (mobile)   |

Rules:

- No token → 401
- Cookie + header simultaneously → 403
- Expired cookie token → silent refresh (pending implementation)
- Expired bearer token → 401

Use the `@Public()` decorator to mark an endpoint as publicly accessible.

## Endpoints

Base: `http://{HOST}:{PORT}/api/v1`

### Health

| Method | Path            | Auth | Description                                 |
| ------ | --------------- | ---- | ------------------------------------------- |
| `GET`  | `/health`       | No   | Full report (liveness + readiness)          |
| `GET`  | `/health/live`  | No   | Liveness: the process is running            |
| `GET`  | `/health/ready` | No   | Readiness: DB, Redis and Keycloak reachable |

**Readiness response:**

```json
{
    "status": "healthy",
    "uptime": 42.3,
    "timestamp": "2026-05-30T12:00:00.000Z",
    "services": {
        "database": { "status": "healthy", "latencyMs": 3 },
        "cache": { "status": "healthy", "latencyMs": 1 },
        "keycloak": { "status": "healthy", "latencyMs": 12 }
    }
}
```
