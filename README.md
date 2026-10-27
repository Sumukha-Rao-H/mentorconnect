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

## Prompts used

This app was built with an AI coding assistant (Claude Code). These are the prompts that produced it.

### Prompt 1: build the app

> Design a website for a Mentor–Mentee application considering the following requirements:
> - i) The mentee enters all their info, i.e. name, USN, hobby, photo, etc.
> - ii) Mentor must have access to that info and also must be able to recommend & give notes.
> - iii) This info can also be endorsed by an administrator.
> - iv) The HOD can also see.
>
> Add some more features if you find it necessary
>
> So basically RBAC student management application, use nextjs itself, use Make the UI responsive and use the provided design for inspiration for the layout, but use this color palette instead ["#353535","#3c6e71","#ffffff","#d9d9d9","#284b63"].
>
> also use this for database
> Set up this app on Neon.
> 1. npm i -g neon@latest. If that fails, use npx neon@latest in place of neon.
>    If a neon command opens a browser sign-in, tell me to finish it there. If that times out or fails, ask me to run neon login, then retry.
> 2. In the project root:
>    neon init -y --org-id org-floral-cake-52370450 --project-id damp-term-08578573 --branch production --services postgres
> 3. neon deploy. It provisions the services in neon.ts and pulls their env vars into .env.local (or .env if it exists).
> 4. Wire each service into the app's code using those env vars. Consult the installed Neon agent skills for best practices, e.g., what database driver to use given the app architecture and hosting runtime.
> 5. Prove it works: npm run build must pass, then start the app, each wired service must be tested to prove it works end to end.
> 6. Report what changed, the command output that proves step 5, and anything that failed.

### Prompt 2: guided tour

> Also add a guided tour for all the pages and functions

### Prompt 3: deploy to Vercel

> I want to host it on vercel, can you use vercel cli and help me do it
