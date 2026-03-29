# Revel Client Portal — Project Context

> **For Claude:** Read this file at the start of every session. Do not restart the project. Do not scaffold new files if they already exist. Audit existing code before building anything. Continue from the current phase.

---

## 1. Project Overview

**App:** Revel Client Portal
**Built for:** Revel, a marketing agency, and their clients

A white-labeled client portal that gives each client a branded, private space to view proofs, documents, tasks, budgets, and analytics — managed internally by the Revel team through an admin backend.

**Two portals in one:**
- **Admin portal** (`/admin/*`) — Revel staff manage clients, users, branding, content
- **Client portal** (`/dashboard`, `/proofs`, etc.) — Clients view their deliverables and activity

**Key capabilities (planned across all phases):**
- Per-client branding (logo, colors, portal name)
- Creative proof review and approval
- Document management
- Task tracking
- Budget visibility
- Analytics reporting
- Role-based access control
- Automated welcome emails with password-set flow

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`, no config file) |
| Components | shadcn/ui — **Radix-based, NOT base-ui** (Button, Dialog, AlertDialog replaced) |
| Database | PostgreSQL (local: `revel_portal`) |
| ORM | Prisma 5 (NOT v7 — v7 breaks `url = env(DATABASE_URL)`) |
| Auth | NextAuth v5 beta (`next-auth@5.0.0-beta`) with Credentials + JWT |
| Email | Resend (`resend` npm package) |
| Icons | Lucide React |
| Forms | `useActionState` (React 19) + Server Actions |
| Validation | Zod v4 (uses `.issues` not `.errors`) |
| Fonts | Inter (body/UI) + Source Serif 4 (headings) via `next/font` |

**Important quirks:**
- Middleware is named `middleware.ts` at the project root (standard Next.js convention)
- Tailwind config is CSS-only via `@theme inline` in `globals.css`
- `useActionState` requires server actions to have `(prevState, formData)` signature
- shadcn v4 ships `@base-ui/react` by default — we replaced Button, Dialog, AlertDialog with standard Radix/forwardRef implementations
- Zod v4 changed `.errors` → `.issues`

---

## 3. Current Progress

### Completed
- **Phase 0** — Architecture planning and project structure
- **Phase 1** — Project setup, auth shell, login page, route protection, database connection, seed data
- **Phase 2** — Client management, user management, per-client branding with logo upload
- **Phase 3** — Client dashboard with live data: summary cards, activity feed, upcoming deadlines

### Not Started
- Phases 4–7

---

## 4. Phase Roadmap

| Phase | Name | Description |
|---|---|---|
| 0 | Architecture | Project structure, data model design, role planning |
| 1 | Setup + Auth | Next.js scaffold, NextAuth, login, route protection, DB setup, seed data |
| 2 | Client + User Management | Admin CRUD for clients, users, per-client branding, logo upload, welcome emails |
| 3 | Client Dashboard | Populate summary cards with real data, activity feed, upcoming deadlines |
| 4 | Proofs Module | Upload, version, review, approve, comment on creative proofs |
| 5 | Documents + Tasks | Document library, task board with status/priority, client-facing views |
| 6 | Budget + Analytics | Budget tracker with line items, analytics report embedding |
| 7 | Polish + Production | Performance, error handling, mobile responsiveness, deployment readiness |

---

## 5. Current Phase

**Current phase: Phase 4 — Proofs Module**

### Phase 3 — Complete
- Summary cards wired to live DB data (pending proofs, budget spent, active tasks, docs to review)
- Activity feed pulling from `ActivityLog` table with entity icons and relative timestamps
- Deadline list combining `Proof.dueDate` + `Task.dueDate`, sorted ascending, with overdue/urgent badges
- All queries run in parallel via `Promise.all`

### Phase 4 — Not started
- Upload proof files (save to `public/uploads/` or cloud storage)
- Proof versioning (`ProofVersion` model)
- Review flow: approve / request changes (`ProofApproval`)
- Comments thread per proof (`ProofComment`)
- Status lifecycle: PENDING_REVIEW → IN_REVIEW → APPROVED / CHANGES_REQUESTED

---

## 6. File / Architecture Notes

```
app/
  (admin)/          # Admin portal — Revel staff only
    admin/
      clients/      # Client list, detail, branding, users tabs
      users/        # User list, detail, create
      dashboard/    # Admin overview
  (auth)/           # Login, set-password pages (unauthenticated)
  (client)/         # Client portal — client users only
    dashboard/
    proofs/
    documents/
    tasks/
    analytics/
    budget/
  api/auth/         # NextAuth route handler
  layout.tsx        # Root layout (fonts, metadata)
  globals.css       # Tailwind v4 theme tokens + base styles

components/
  admin/            # Admin-specific forms and UI (ClientForm, UpdateBrandingForm, DeleteUserButton, etc.)
  auth/             # Auth-specific components (SetPasswordForm)
  dashboard/        # Shared dashboard components (SummaryCard)
  layout/           # Sidebar components (AdminSidebar, ClientSidebar, PageHeader)
  shared/           # Reusable primitives (ConfirmAction, EmptyState, FormError, SubmitButton)
  ui/               # shadcn/ui base components (all Radix-based)

lib/
  actions/          # Server actions (clients.ts, users.ts, setPassword.ts)
  auth.ts           # NextAuth config
  branding.ts       # getClientBranding() helper + REVEL_DEFAULTS
  email.ts          # Resend email (sendWelcomeEmail)
  permissions.ts    # Role helpers (canManageClients, isClientUser, etc.)
  prisma.ts         # Prisma client singleton
  tokens.ts         # Password reset token generation + validation
  utils.ts          # cn(), slugify(), formatDate()

prisma/
  schema.prisma     # Full data model
  seed.ts           # Dev seed data (6 users across 2 clients)

public/
  logos/            # Client logo uploads (uploaded via branding form)
  revel-icon.png    # Revel brand icon (used as user avatar in client sidebar)

middleware.ts        # Route protection middleware (must be this exact name)
types/index.ts      # Shared TypeScript types
```

### Key Patterns

- **Server components** fetch data directly via Prisma; mutations use Server Actions
- **Forms** use `useActionState` with `(prevState: unknown, formData: FormData)` signature on actions
- **Server actions with bound args** (e.g. `updateClient.bind(null, clientId)`) still receive `(prevState, formData)` after binding
- **Per-client branding** is fetched in `(client)/layout.tsx` and passed as CSS custom properties + props to `ClientSidebar`
- **Role hierarchy:** `SUPER_ADMIN > REVEL_ADMIN > REVEL_TEAM > CLIENT_ADMIN > CLIENT_USER`
- **Logo uploads** saved to `public/logos/` as `{clientId}-{timestamp}.ext`; URL stored as `/logos/filename`
- **Password reset tokens** are 32-byte random hex strings stored in `PasswordResetToken` table, expire in 72 hours

---

## 7. Known Issues / TODOs

### Bugs
- None currently known

### Incomplete Features
- Client dashboard summary cards show `—` placeholders (Phase 3 work remaining)
- Activity feed is empty state only
- Upcoming deadlines is empty state only
- No resend-invite flow if welcome email fails (token exists in DB but no UI to trigger resend)

### Technical Debt
- `components/ui/avatar.tsx` uses `@base-ui/react/avatar` — if avatar is needed beyond static images, this should be replaced with a Radix-based implementation like Button/Dialog were
- `ConfirmAction` component calls server actions via `onClick` (unreliable for actions with `redirect()`). Any new confirm-and-delete patterns should use the `DeleteUserButton` approach (form action inside dialog)
- Logo uploads go to `public/logos/` which is fine for dev but needs cloud storage (e.g. Vercel Blob, S3) for production
- `.env` is gitignored — new contributors need to create it manually

### Environment Setup Required
- `RESEND_API_KEY` — must be set to a real Resend key for emails to send
- On Resend free plan, `from` must remain `onboarding@resend.dev` until a domain is verified
- `AUTH_SECRET` — already generated, in `.env`
- `DATABASE_URL` — PostgreSQL, local dev: `postgresql://juliakline@localhost:5432/revel_portal`

---

## 8. Instructions for Future Claude Sessions

1. **Do not restart the project.** The scaffold, database, auth, and two full phases are already built. Read this file and the existing code before doing anything.

2. **Always audit before building.** Before creating any file, check if it already exists. Before writing any function, check if it already exists in `lib/`.

3. **Continue from the current phase.** Check section 5 of this file for exactly where to pick up.

4. **Do not duplicate logic.** Branding helpers live in `lib/branding.ts`. Permissions live in `lib/permissions.ts`. Token logic lives in `lib/tokens.ts`. Email lives in `lib/email.ts`. Use them.

5. **Follow existing patterns.** Server actions use `(prevState: unknown, formData: FormData)`. Bound actions (`.bind(null, id)`) also follow this. Forms use `useActionState`. No `useState` for form data unless it's a controlled field like color pickers.

6. **Update this file at the end of each phase.** When a phase is complete, update sections 3, 5, and 7 to reflect the new state.

7. **Push to GitHub at the end of each phase.** After updating this file, run:
   ```bash
   git add -A
   git commit -m "phase X complete: <brief description>"
   git push
   ```
   Remote: `https://github.com/marketingworksmcc-blip/Client-Dashboard.git`

8. **Do not change the tech stack.** Prisma 5, not 7. Tailwind v4 CSS-only config. Radix-based shadcn components, not base-ui.

---

## 9. Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000

# Push schema changes to DB (use instead of migrate dev)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# Seed the database
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Open Prisma Studio (DB browser)
npx prisma studio

# Clear Next.js cache (fixes stale build issues)
rm -rf .next
```

### Dev Seed Accounts

| Email | Password | Role |
|---|---|---|
| superadmin@revel.agency | revel-super-2024 | Super Admin |
| admin@revel.agency | revel-admin-2024 | Revel Admin |
| team@revel.agency | revel-team-2024 | Revel Team |
| admin@acmeco.com | client-admin-2024 | Client Admin (Acme Co) |
| user@acmeco.com | client-user-2024 | Client User (Acme Co) |
| admin@blueharbor.com | client-admin-2024 | Client Admin (Blue Harbor) |

### Required `.env` File

```env
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/revel_portal?schema=public"
AUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_your_key_here"
UPLOAD_DIR="public/uploads"
MAX_FILE_SIZE_MB=50
```

Generate `AUTH_SECRET` with: `openssl rand -base64 32`
