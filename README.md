# SaaS RBAC — Multi-Tenant Authorization System

> A production-grade, multi-tenant SaaS platform built with **Node.js**, **Fastify**, **Next.js**, and **CASL** — implementing fine-grained **Role-Based Access Control (RBAC)** across isolated organizations, projects, and resources.

Built as part of my ongoing exploration of **scalable fullstack architecture**, with a strong emphasis on authorization design, clean separation of concerns, and product-driven engineering.

---

## What This Project Is About

Modern SaaS products share a common, non-trivial challenge: **who can do what, where, and under which conditions**.

This project addresses that challenge head-on by implementing a complete **multi-tenant RBAC system** — where each tenant (organization) is isolated, users hold different roles per organization, and permissions are enforced consistently across the entire application using **CASL** as the authorization engine.

Key design goals:
- **Multi-tenancy** — each organization is a separate tenant with its own members, projects, and permissions
- **RBAC** — users hold roles (`ADMIN`, `MEMBER`, `BILLING`) scoped to each organization
- **Isomorphic authorization** — the `@saas/auth` package is shared between backend and frontend
- **Type safety end-to-end** — TypeScript + Zod + Prisma from database schema to HTTP response
- **Monorepo** — managed with Turborepo for fast, incremental builds

---

## Tech Stack

### Core
| Tool | Purpose |
|------|---------|
| **Node.js** (≥18) | JavaScript runtime |
| **TypeScript** | Type-safe development |
| **pnpm** | Fast, disk-efficient package manager |
| **Turborepo** | Monorepo build system with caching |

### Backend — `apps/api`
| Tool | Purpose |
|------|---------|
| **Fastify** | High-performance HTTP framework |
| **Zod** | TypeScript-first schema validation |
| **Prisma 7** | Type-safe ORM with PostgreSQL adapter |
| **PostgreSQL** | Relational database |
| **bcryptjs** | Password hashing |

### Frontend — `apps/web`
| Tool | Purpose |
|------|---------|
| **Next.js** | React framework with SSR/SSG |
| **TypeScript** | Type-safe UI development |
| **Tailwind CSS** | Utility-first styling |

### Authorization
| Tool | Purpose |
|------|---------|
| **CASL** | Isomorphic, attribute-based authorization |
| **@saas/auth** | Shared RBAC package (abilities + permissions) |

---

## RBAC Design

### Roles

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| `ADMIN` | Organization-wide | Full access to all resources; manage members, projects, billing |
| `MEMBER` | Project-level | View users; create, read, update and delete own projects |
| `BILLING` | Billing-only | Manage billing information exclusively |

### Subjects

Permissions are structured around **subjects** — the entities being acted upon:

| Subject | Actions |
|---------|---------|
| `User` | `get`, `update`, `delete` |
| `Organization` | `manage`, `update`, `delete`, `transfer-ownership` |
| `Project` | `manage`, `get`, `create`, `update`, `delete` |
| `Invite` | `get`, `create`, `delete` |
| `Billing` | `manage` |

### How It Works

```typescript
import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ id: 'user-id', role: 'MEMBER' })

// Can the user create a project?
ability.can('create', 'Project') // true

// Can the user update a project they don't own?
ability.can('update', subject('Project', { ownerId: 'other-user-id' })) // false

// Can the user update their own project?
ability.can('update', subject('Project', { ownerId: 'user-id' })) // true
```

The `@saas/auth` package is **isomorphic** — the same ability definitions are consumed by both the Fastify API and the Next.js frontend, eliminating permission drift between layers.

---

## Multi-Tenancy Model

Each **Organization** is an isolated tenant. A user can belong to multiple organizations with different roles in each:

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
│   │   │   │       └── auth/       # Authentication routes
│   │   │   └── lib/
│   │   │       └── prisma.ts       # Prisma client (pg adapter)
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   ├── seeds.ts            # Seed script
│   │   │   └── migrations/
│   │   └── prisma.config.ts        # Prisma 7 config
│   └── web/                        # Next.js frontend
├── packages/
│   └── auth/                       # Shared RBAC package (CASL)
│       └── src/
│           ├── index.ts            # defineAbilityFor
│           ├── permissions.ts      # Role → permission mappings
│           ├── roles.ts            # Role enum
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
# 1. Clone the repository
git clone <repository-url>
cd saas-rbac

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
# apps/api/.env
DATABASE_URL="postgresql://docker:docker@localhost:5432/next-saas"

# 4. Start PostgreSQL
docker-compose up -d

# 5. Run migrations
cd apps/api && pnpm prisma migrate dev

# 6. Seed the database
pnpm prisma db seed
```

### Development

```bash
# Run all apps in parallel (Turborepo)
pnpm dev

# API only
cd apps/api && pnpm dev   # http://localhost:3333

# Web only
cd apps/web && pnpm dev   # http://localhost:3000
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in watch mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm check-types` | TypeScript type checking |

---

## Architecture Notes

### Why Turborepo?
Tasks like `build`, `lint`, and `check-types` are cached and parallelized. Changing only `packages/auth` won't trigger a rebuild of unrelated apps.

### Why CASL?
CASL enables **attribute-based conditions** on top of role-based rules — e.g., "a MEMBER can update a Project, but only if they own it." This goes beyond simple role checks and supports the nuanced permission models real SaaS products require.

### Why a shared `@saas/auth` package?
Authorization logic defined once, consumed everywhere. The API enforces it server-side; the frontend uses it to conditionally render UI — no duplication, no drift.