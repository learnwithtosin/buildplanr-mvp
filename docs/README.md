# BuildPlanr

AI-generated business plans tailored to the Nigerian market.

## Why BuildPlanr Exists

General-purpose AI business plan tools produce generic output — they don't know Nigerian regulations, don't understand regional market differences, and fill financial sections with placeholder numbers. BuildPlanr grounds every plan in curated Nigerian regulatory and market data (CAC, FIRS, SMEDAN, NAFDAC, and more) via a lightweight retrieval step, so the output is something a real entrepreneur could actually use.

## MVP Scope

Idea intake → dynamic questionnaire → AI-generated plan (with Nigerian context) → PDF/Word download. No accounts, payments, dashboards, or admin panel — deliberately out of scope for this MVP.

## Technology Stack

Next.js, React, TypeScript, Tailwind (frontend) · Node.js, Express, TypeScript (backend) · PostgreSQL + Prisma · OpenAI Responses API · Docker, Railway, Vercel.

## Repository Structure

```
buildplanr-mvp/
├── apps/web/        # Next.js frontend
├── apps/api/         # Express backend
├── packages/types/   # shared TypeScript contracts
├── docs/             # Architecture.md, API.md, Database.md, TEAM_RULES.md
└── docker-compose.yml
```

## Quick Start

```
git clone <repo-url>
cd buildplanr-mvp
npm install
```

**Environment variables** — copy the examples and fill in real values:
```
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```
`apps/api/.env` needs `DATABASE_URL` and `OPENAI_API_KEY`. Ask your lead for the OpenAI key if it isn't already shared.

**Run Docker (local Postgres):**
```
docker compose up -d
```

**Run the backend:**
```
npm run dev --workspace=apps/api
```
Confirm it's alive at `http://localhost:4000/health`.

**Run the frontend:**
```
npm run dev --workspace=apps/web
```
Open `http://localhost:3000`.

## Team Workflow

One GitHub Issue per developer branch, small PRs, one approval, squash-merge. Full rules: `docs/TEAM_RULES.md`.

## Documentation

Everything else lives in `/docs`:
- [`Architecture.md`](docs/Architecture.md) — how the system fits together
- [`API.md`](docs/API.md) — the exact contract between frontend and backend
- [`Database.md`](docs/Database.md) — the schema
- [`TEAM_RULES.md`](docs/TEAM_RULES.md) — how we work together