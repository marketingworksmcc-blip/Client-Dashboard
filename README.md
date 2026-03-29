# Revel Client Portal

A production-ready client portal for Revel, a marketing agency. Clients can review creative proofs, track budgets, view analytics, manage documents, and complete tasks — all in a branded portal experience.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix-based)
- **ORM**: Prisma 5
- **Database**: PostgreSQL
- **Auth**: NextAuth v5 (Credentials)

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted instance)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/revel_portal?schema=public"
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Create the database

```bash
createdb revel_portal
```

### 4. Run migrations + seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

### Revel Team (→ `/admin/dashboard`)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@revel.agency | revel-super-2024 |
| Revel Admin | admin@revel.agency | revel-admin-2024 |
| Team Member | team@revel.agency | revel-team-2024 |

### Client Portal (→ `/dashboard`)

| Client | Email | Password |
|---|---|---|
| Acme Co Admin | admin@acmeco.com | client-admin-2024 |
| Acme Co User | user@acmeco.com | client-user-2024 |
| Blue Harbor Admin | admin@blueharbor.com | client-admin-2024 |

---

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:reset     # Reset and re-seed database
```

---

## Project Structure

```
app/
  (auth)/login/       → Login page
  (admin)/admin/      → Admin portal pages (Revel team)
  (client)/           → Client portal pages
  api/auth/           → NextAuth API route
components/
  ui/                 → shadcn/ui primitives
  layout/             → Sidebars, PageHeader
  dashboard/          → SummaryCard
  shared/             → EmptyState, StatusBadge
lib/
  auth.ts             → NextAuth config
  prisma.ts           → Prisma client singleton
  permissions.ts      → Role/permission helpers
  branding.ts         → Per-client branding resolver
prisma/
  schema.prisma       → Full data model
  seed.ts             → Demo data seeder
```

---

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| 0 | ✅ | Architecture + planning |
| 1 | ✅ | Setup, design system, auth shell |
| 2 | ⏳ | Database schema + client/user management |
| 3 | ⏳ | Client dashboard + activity + deadlines |
| 4 | ⏳ | Creative proofs module |
| 5 | ⏳ | Documents + tasks |
| 6 | ⏳ | Budget tracker + analytics |
| 7 | ⏳ | Polish + production readiness |
