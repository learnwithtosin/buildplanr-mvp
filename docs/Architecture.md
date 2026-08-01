# Architecture.md

## Project Overview

BuildPlanr generates business plans tailored to the Nigerian market. A user describes a business idea, answers a short dynamic questionnaire, and receives a structured plan — grounded in real Nigerian regulatory and market data via a lightweight retrieval step (RAG), not a generic template — downloadable as PDF or Word.

## MVP Scope

In scope: idea intake, dynamic questionnaire, AI plan generation with Nigerian context, PDF/Word export.
Out of scope: accounts, payments, subscriptions, dashboards, notifications, admin panel, analytics, chat, collaboration, multi-tenancy. If it's not in `API.md`, it's not in this MVP.

## Repository Structure

One repository, npm workspaces:

```
buildplanr-mvp/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/         # Express backend
├── packages/
│   └── types/       # shared TypeScript contracts
├── docs/            # this file, API.md, Database.md, TEAM_RULES.md
├── docker-compose.yml
└── package.json
```

## Folder Structure

```
apps/web/src/
├── app/                          # pages (App Router)
├── components/                   # IdeaForm, QuestionnaireForm, PlanView, LoadingState
└── lib/                          # api.ts, usePlanStatus.ts

apps/api/src/
├── routes/
├── controllers/
├── services/                     # questionnaire, plan-generation, rag, export-pdf, export-docx
└── middleware/
apps/api/prisma/
```

## Tech Stack

Next.js, React, TypeScript, Tailwind (frontend) · Node.js, Express, TypeScript (backend) · PostgreSQL + Prisma · OpenAI Responses API · Docker, Railway, Vercel.

## How the Pieces Work Together

Frontend calls the backend over HTTPS/JSON only — no direct database or OpenAI access from `apps/web`. Backend is the only thing touching Postgres and OpenAI. Both sides import from `packages/types` so a contract change is a compile error, not a runtime surprise.

## Shared Types

`packages/types` holds one request/response type per endpoint in `API.md`, plus the `Question` and `PlanContent` shapes. Backend owns this package (writes it); frontend consumes it (never redefines types locally for anything crossing the API boundary).

## RAG Overview (high level)

Before generating a plan, the backend embeds the business idea/answers and runs a similarity search against a curated table of Nigerian regulatory/market content (`KnowledgeChunk`, stored in Postgres via `pgvector`). The top matches are inserted into the plan-generation prompt as context. This is retrieval only — no agent behavior, no multi-step reasoning.

## OpenAI Responses API Workflow

Two calls per plan:
1. **Questionnaire generation** — idea in, 4–6 tailored questions out.
2. **Plan generation** — answers + RAG context in, the full structured plan out.

Both go through a single thin client wrapper (`openai.client.ts`).

## Development Workflow

Build against `packages/types` and the documented shapes in `API.md` — frontend doesn't need a working backend to start; mock responses matching the contract, swap to real calls once the endpoint exists.

## Git Branching Strategy

`main` is protected. Branch per Issue: `feature/<short-description>`, `bugfix/<short-description>`, `docs/<short-description>`, `chore/<short-description>`.

## Pull Request Workflow

Small, single-Issue PRs. One approval required. Squash-merge into `main`. See `TEAM_RULES.md` for the full checklist.

## Coding Conventions

TypeScript strict, no `any`. Match the layer you're in (route/controller/service on the backend; page/component on the frontend). No new dependencies without approval. Match `packages/types` at every API boundary.