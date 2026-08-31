# ClubHub

**Management software for sports clubs, built from the ground up to replace spreadsheets and group chats.**

🔗 [Landing page](https://turf-club-hub-landing.vercel.app/)

ClubHub is a multi-tenant SaaS platform for running the day-to-day operations of a sports club: athlete registration, attendance tracking, event scheduling, duty rotations, and finances — all in one place, with each club's data fully isolated from every other club's.

Founded and built end-to-end by its Founder & CEO — product, architecture, and code.

## The problem

Most amateur and semi-pro sports clubs run on a patchwork of spreadsheets, WhatsApp groups, and paper sign-in sheets. That makes it hard to answer basic questions: Who's actually showing up to training? Who owes dues? Whose turn is it to bring the equipment this week? ClubHub replaces that patchwork with a single system that every athlete and coach logs into, with rules the club actually cares about built in — not generic scheduling software bent into shape.

## In production

ClubHub is live and in active use by **Desterro Hóquei Clube**, managing real athletes, real training sessions, and real attendance data — not a demo or a prototype.

## What it does

- **Athlete management** — registration, categories, and per-athlete history
- **Attendance & performance tracking** — a weighted points system that distinguishes mandatory training from optional extra sessions, computes attendance rate and progress toward each athlete's yearly goal, and classifies athletes into performance tiers
- **Events & calendar** — scheduling for training sessions and club events, with athlete confirmation
- **Duty rotation** — automated rotation scheduling for recurring club responsibilities
- **Finance** — dues, debts, and financial reporting per athlete and per club
- **Audit log** — a record of administrative actions for accountability
- **Bulk actions** — batch operations for admins managing large rosters
- **Role-based access** — athlete, club admin, and super admin roles, each scoped to what they should be able to see and do

## Multi-tenant security architecture

Supporting more than one club on shared infrastructure required building real tenant isolation, not just a `club_id` column:

- **Data isolation by club** — Postgres Row-Level Security policies enforce that a club's data (athletes, events, attendance, finances) is never visible to another club, at the database layer, not just in the UI
- **Login restricted to registered athletes** — accounts not tied to a registered athlete are blocked at login with a clear error, rather than landing in an empty or broken app state
- **Tiered permissions** — `athlete`, `club_admin`, and `super_admin` roles, with helper functions in the database (`is_club_admin()`, `can_access_club()`, `get_user_club_id()`, etc.) so access rules are enforced consistently across every table and query, not re-implemented per feature

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Row-Level Security)
- React Query

## Running locally

Prerequisites: Node.js and a package manager (npm or pnpm).

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd turf-club-hub

# Install dependencies
npm i

# Copy the environment template and fill in your Supabase credentials
cp .env.example .env

# Start the dev server
npm run dev
```

Environment variables needed (see `.env.example`):

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```
