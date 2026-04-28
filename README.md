# SaaS RBAC

A multi-tenant SaaS platform with fine-grained **Role-Based Access Control (RBAC)**, built with Node.js, Fastify, Next.js, and CASL.

---

## Overview

Modern SaaS products share a non-trivial challenge: **who can do what, where, and under which conditions**. This project addresses that by implementing a complete multi-tenant RBAC system using CASL as the authorization engine.

- **Multi-tenancy** — each organization is an isolated tenant with its own members, projects, and permissions
- **RBAC** — users hold roles (`ADMIN`, `MEMBER`, `BILLING`) scoped to each organization
- **Isomorphic authorization** — the `@saas/auth` package is shared between API and frontend
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
│   │   │   │   └── routes/
│   │   │   │       └── auth/       # create-account, authenticate-with-password
│   │   │   └── lib/
│   │   │       └── prisma.ts       # Prisma client (pg adapter)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seeds.ts
│   │   │   └── migrations/
│   │   └── prisma.config.ts
│   └── web/                        # Next.js frontend
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

API docs available at `http://localhost:3333/docs` (Swagger UI).

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