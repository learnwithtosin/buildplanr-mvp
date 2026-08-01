# BuildPlanr MVP

AI-powered business planning platform built specifically for Nigerian entrepreneurs.

## Purpose

BuildPlanr helps entrepreneurs generate structured business plans tailored to Nigeria using OpenAI Responses API, curated Nigerian business knowledge (RAG), and local regulatory information.

## MVP Features

- Business idea questionnaire
- AI-generated business plans
- Nigerian-focused recommendations
- RAG-powered contextual knowledge
- PDF export
- Word document export

## Technology Stack

Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

AI
- OpenAI Responses API
- RAG

Infrastructure
- Docker
- GitHub
- Vercel (Frontend)
- Railway (Backend & Database)

## Repository Structure

apps/
  web/
  api/

packages/
  types/

docs/

## Quick Start

1. Clone the repository

2. Copy the environment file

cp .env.example .env

3. Start PostgreSQL

docker-compose up -d

4. Install dependencies

npm install

5. Start the frontend

npm run dev:web

6. Start the backend

npm run dev:api

## Documentation

Before working on any issue, read:

- docs/Architecture.md
- docs/API.md
- docs/Database.md
- docs/TEAM_RULES.md

## Team Workflow

- One GitHub Issue = One Branch
- One Pull Request = One Issue
- Never commit directly to main
- Follow the shared TypeScript types
- Only modify files related to your assigned issue

---

BuildPlanr MVP • Built for Nigerian Entrepreneurs 🇳🇬