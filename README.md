# SaaS RBAC

A multi-tenant SaaS platform with fine-grained **Role-Based Access Control (RBAC)**, built with Node.js, Fastify, Next.js, and CASL.

---

## Overview

Modern SaaS products share a non-trivial challenge: **who can do what, where, and under which conditions**. This project addresses that by implementing a complete multi-tenant RBAC system using CASL as the authorization engine.

- **Multi-tenancy** — each organization is an isolated tenant with its own members, projects, and permissions
- **RBAC** — users hold roles (`ADMIN`, `MEMBER`, `BILLING`) scoped to each organization
- **Isomorphic authorization** — the `@saas/auth` package is shared between API and frontend
- **Real-time presence** — WebSocket-backed online/offline status, scoped per organization
- **Type safety end-to-end** — TypeScript + Zod + Prisma from schema to HTTP response
- **Monorepo** — managed with Turborepo for incremental, cached builds

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Runtime** | Node.js ≥ 18 | JavaScript runtime |
| **Language** | TypeScript | Type-safe development |
| **Monorepo** | Turborepo + pnpm | Build orchestration and caching |
| **API** | Fastify 5 | High-performance HTTP framework |
| **Auth** | @fastify/jwt | JWT-based authentication |
| **Real-time** | @fastify/websocket | WebSocket server for presence and chat |
| **Docs** | @fastify/swagger | OpenAPI / Swagger UI |
| **Validation** | Zod | Schema validation and type inference |
| **ORM** | Prisma 7 | Type-safe ORM with pg adapter |
| **Database** | PostgreSQL | Relational database |
| **Authorization** | CASL | Isomorphic, attribute-based permissions |
| **Frontend** | Next.js | React framework with SSR |
| **Styling** | Tailwind CSS | Utility-first CSS |

---

## RBAC Design

### Roles

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| `ADMIN` | Organization-wide | Full access; manage members, projects, billing |
| `MEMBER` | Project-level | View users; create/read/update/delete own projects |
| `BILLING` | Billing-only | Manage billing information exclusively |

### Subjects

| Subject | Actions |
|---------|---------|
| `User` | `get`, `update`, `delete` |
| `Organization` | `manage`, `update`, `delete`, `transfer-ownership` |
| `Project` | `manage`, `get`, `create`, `update`, `delete` |
| `Invite` | `get`, `create`, `delete` |
| `Billing` | `manage` |

### Usage

```typescript
import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ id: 'user-id', role: 'MEMBER' })

ability.can('create', 'Project')                                          // true
ability.can('update', subject('Project', { ownerId: 'other-user-id' })) // false
ability.can('update', subject('Project', { ownerId: 'user-id' }))       // true
```

The same ability definitions are consumed by both the API and the frontend — no duplication, no permission drift.

---

## Real-Time Presence

Each member of an organization sees which teammates are currently online, live, without polling.

### Endpoint

```
GET /organizations/:slug/presence     (WebSocket upgrade)
```

### Authentication happens at the handshake

The browser `WebSocket` API cannot send an `Authorization` header, so the JWT travels as a query parameter and is verified in a `preHandler` — the last point in the lifecycle where the request is still HTTP and can be rejected with a real `401`.

Membership is resolved **once**, at that moment. The connection is then permanently bound to a `(userId, organizationId)` pair, so no client-supplied payload can ever change which tenant a socket belongs to.

> Because the token is validated once and the connection is long-lived, removing a member from an organization must also close their open sockets — expiry alone will not disconnect them.

### Protocol

| Event | Direction | Payload |
|-------|-----------|---------|
| `presence:sync` | server → client | `userIds: string[]` — full state, sent on connect |
| `presence:online` | server → client | `userId: string` |
| `presence:offline` | server → client | `userId: string` |

### Implementation notes

- **Presence is per user, not per connection.** Sockets are reference-counted in a `Map<userId, Set<WebSocket>>`, so three open tabs count as one online user and only the transition from 0 → 1 (or 1 → 0) is broadcast.
- **5s grace period on disconnect** — a page refresh closes and reopens the socket within milliseconds; without the delay every reload would make the user blink offline for everyone.
- **30s heartbeat** — half-open TCP connections (closed laptop, dropped wifi) never fire a `close` event, so unanswered `ping`/`pong` rounds terminate the socket and free the registry entry.
- **Client reconnects with exponential backoff and jitter** — without jitter, every client would reconnect on the same millisecond after an API restart.

### Chat

The chat sidebar (contacts list, conversation view, composer) is wired to real organization members and live presence. Message **delivery and persistence are not implemented yet** — the composer currently keeps messages in local component state only.

### Scaling limitation

The presence registry lives in the API process memory. With more than one instance, users connected to different replicas cannot see each other. Horizontal scaling requires moving broadcast to Redis pub/sub — every broadcast already funnels through a single function, so the change is contained.

---

## Multi-Tenancy Model

A user can belong to multiple organizations with different roles in each:

```
User
 ├── Organization A → role: ADMIN
 ├── Organization B → role: MEMBER
 └── Organization C → role: BILLING
```

Organizations can also **auto-attach users by email domain**, simplifying onboarding for company-wide deployments.

---

## Project Structure

```
saas-rbac/
├── apps/
│   ├── api/                        # Fastify REST API
│   │   ├── src/
│   │   │   ├── http/
│   │   │   │   ├── server.ts
│   │   │   │   ├── middlewares/
│   │   │   │   │   └── auth.ts     # getCurrentUserId, getUserMembership
│   │   │   │   └── routes/
│   │   │   │       ├── auth/       # create-account, authenticate-with-password
│   │   │   │       └── ws/         # organization-presence (WebSocket route)
│   │   │   ├── ws/
│   │   │   │   └── presence.ts     # in-memory presence registry
│   │   │   └── lib/
│   │   │       └── prisma.ts       # Prisma client (pg adapter)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seeds.ts
│   │   │   └── migrations/
│   │   └── prisma.config.ts
│   └── web/                        # Next.js frontend
│       └── src/
│           ├── app/(app)/chat/     # chat sidebar, conversation view
│           └── components/ws/
│               └── presence-provider.tsx   # single WS connection + online users context
├── packages/
│   └── auth/                       # Shared RBAC package (CASL)
│       └── src/
│           ├── index.ts            # defineAbilityFor
│           ├── permissions.ts      # Role → permission mappings
│           ├── roles.ts
│           ├── models/             # Zod schemas for subjects
│           └── subjects/           # CASL subject definitions
└── config/
    ├── eslint-config/
    ├── prettier/
    └── typescript-config/
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9
- Docker + Docker Compose

### Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd saas-rbac
pnpm install

# 2. Configure environment — apps/api/.env
DATABASE_URL="postgresql://docker:docker@localhost:5432/next-saas"
JWT_SECRET="your-secret-here"

# 3. Start PostgreSQL
docker-compose up -d

# 4. Run migrations and seed
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

### Development

```bash
pnpm dev              # All apps in parallel (Turborepo)
cd apps/api && pnpm dev   # API only → http://localhost:3333
cd apps/web && pnpm dev   # Web only → http://localhost:3000
```

API docs available at `http://localhost:3333/swagger` (Swagger UI).

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in watch mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm check-types` | TypeScript type checking |

---

## Architecture Notes

**Turborepo** — `build`, `lint`, and `check-types` are cached and parallelized. Changing only `packages/auth` won't trigger a rebuild of unrelated apps.

**CASL** — enables attribute-based conditions on top of role checks (e.g., "a MEMBER can update a Project, but only if they own it"). This goes beyond simple role checks and supports nuanced permission models real SaaS products require.

**Shared `@saas/auth` package** — authorization logic defined once, consumed by both API and frontend. The API enforces it server-side; the frontend uses it to conditionally render UI.

**WebSocket authorization** — the same multi-tenant boundary the HTTP routes enforce per request is enforced per *connection*. Resolving membership at the handshake means every frame on that socket is already scoped to the correct organization, with no tenant identifier ever accepted from the client.