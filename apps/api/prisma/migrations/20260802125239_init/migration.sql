-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('awaiting_answers', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "BusinessPlan" (
    "id" TEXT NOT NULL,
    "businessIdea" TEXT NOT NULL,
    "industryCategory" TEXT,
    "region" TEXT,
    "questionnaire" JSONB NOT NULL,
    "answers" JSONB,
    "status" "PlanStatus" NOT NULL DEFAULT 'awaiting_answers',
    "content" JSONB,
    "modelUsed" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessPlan_status_idx" ON "BusinessPlan"("status");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_category_idx" ON "KnowledgeChunk"("category");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_region_idx" ON "KnowledgeChunk"("region");
