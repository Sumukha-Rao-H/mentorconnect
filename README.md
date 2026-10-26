# MentorConnect

A role-based (RBAC) mentor–mentee management app built with Next.js 16 (App Router), Drizzle ORM and Neon Postgres.

**Live demo:** https://mentorconnect-tau.vercel.app

## Roles and what they can do

| Capability | Mentee | Mentor | Admin | HOD |
| --- | :-: | :-: | :-: | :-: |
| Fill in own profile (name, USN, semester, hobbies, skills, photo, contacts…) | ✅ | | | |
| Submit profile for endorsement | ✅ | | | |
| View assigned mentees' profiles | | ✅ | | |
| View every mentee | | | ✅ | ✅ (read-only) |
| Add recommendations (visible to mentee) and notes (optionally private) | | ✅ | | |
| Set goals, schedule meetings, record minutes | | ✅ | goals only for self (mentee) | |
| Endorse a profile / request changes with a remark | | | ✅ | |
| Assign mentors, create users, change roles, deactivate accounts | | | ✅ | |
| Reports, CSV export, audit log | | | ✅ | ✅ |

Permissions are defined once in [src/lib/rbac.ts](src/lib/rbac.ts) and enforced in three places:
1. [src/proxy.ts](src/proxy.ts): an optimistic redirect based on the signed session cookie.
2. Every page: `requireRole()` / `canViewMentee()`, using the role freshly read from the database.
3. Every server action: `requirePermission()` / `assertCanViewMentee()`, so a crafted request can't get past the UI.

### Extra features beyond the brief
- Profile completion meter, plus a draft → submitted → endorsed / changes-requested workflow. Editing an endorsed profile resets it to draft.
- Private staff notes, which mentees never see, alongside recommendations, which mentees can acknowledge.
- Goals with due dates, meetings with minutes, and a calendar with a "tasks today" rail.
- Endorsement queue with quick endorse, plus mentor assignment from the dashboard.
- HOD and admin reports: status mix, semester distribution, mentor workload, and CSV export (with formula-injection protection).
- An audit log of sign-ins, profile changes, endorsements, notes and meetings.
- A responsive layout: sidebar on desktop, drawer on mobile, card lists instead of tables on phones.
- **Guided tour** ([src/components/tour](src/components/tour)): a role-specific, multi-page walkthrough that spotlights each feature and moves between pages for you.
  - It starts automatically on a user's first visit to the dashboard. After that, restart it from the **Tour** button in the top bar.
  - The **Help & Tour** page lists every function for the role, page by page, each with a "Show me" button that replays just that section.
  - Controls: arrow keys and Esc. On phones the step card becomes a bottom sheet.
  - Steps live in [steps.ts](src/components/tour/steps.ts) and point at `data-tour="…"` anchors on the pages.

## Setup

```bash
npm install
neon deploy            # provisions Neon and writes DATABASE_URL / DATABASE_URL_UNPOOLED to .env.local
```

Add a session secret to `.env.local`:

```bash
node -e "console.log('SESSION_SECRET='+require('crypto').randomBytes(32).toString('base64url'))" >> .env.local
```

```bash
npm run db:migrate     # applies drizzle/ migrations over the direct (unpooled) URL
npm run db:seed        # demo data (wipes the app tables)
npm run dev            # or: npm run build && npm start
```

## Deployment

The app is hosted on Vercel, and the project is linked to this GitHub repo.

- Every push to `main` deploys to production. Pushes to other branches get preview URLs.
- The Vercel project needs two environment variables:
  - `DATABASE_URL`: Neon's pooled connection string.
  - `SESSION_SECRET`: a random string used to sign login sessions.
- On Vercel, the `pg` pool is registered with `attachDatabasePool` from `@vercel/functions`, so idle connections close cleanly when an instance is paused.
- To deploy manually from your machine, run `vercel deploy --prod`.

## Demo accounts (seed data only)

Every seeded account uses the password defined as `DEMO_PASSWORD` in [src/db/seed.ts](src/db/seed.ts).

| Role | Email |
| --- | --- |
| Admin | admin@nmamit.test |
| HOD | hod@nmamit.test |
| Mentor | meera@nmamit.test, suresh@nmamit.test |
| Mentee | kavya@nmamit.test, rohan@nmamit.test, sneha@nmamit.test, arjun@nmamit.test, divya@nmamit.test, nikhil@nmamit.test |

New mentees can also self-register at `/register`.

## Design

The layout follows the provided "E-Skool" reference: a solid sidebar, a hero card with an illustration, card sections with "View more" links, and a right rail with a calendar and today's tasks. It uses this palette:

`#353535` ink · `#3c6e71` teal · `#ffffff` · `#d9d9d9` mist · `#284b63` navy (tokens live in [src/app/globals.css](src/app/globals.css)).

## Database

- The app connects with `node-postgres` through a pooled client on Neon's `-pooler` endpoint ([src/db/index.ts](src/db/index.ts)). That is Neon's recommendation for a long-running Node server.
- Migrations and seeding use `DATABASE_URL_UNPOOLED`.
- Schema: [src/db/schema.ts](src/db/schema.ts). Tables: `users`, `mentee_profiles`, `notes`, `goals`, `meetings`, `audit_logs`.
