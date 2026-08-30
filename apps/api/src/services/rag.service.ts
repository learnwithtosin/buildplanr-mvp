import { prisma } from "../config/prisma.js";
import { createEmbedding } from "./openai.client.js";

/**
 * RAG retrieval — embedding + pgvector similarity search only.
 *
 * Deliberately does not build a plan-generation prompt or reason about
 * results; callers are responsible for deciding how to use the returned
 * chunks. No agent loop, no multi-step reasoning — a single embed + query.
 */

export interface RagQueryOptions {
  /** Optional category filter, matched against KnowledgeChunk.category. */
  category?: string;
  /** Optional region filter, matched against KnowledgeChunk.region. */
  region?: string;
}

interface KnowledgeChunkRow {
  content: string;
}

const TOP_K = 5;

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Embeds `text` (the business idea and/or questionnaire answers, joined by
 * the caller into one string) and returns the top 5 most similar
 * KnowledgeChunk rows by cosine similarity, as plain text content.
 *
 * If `category` and/or `region` are provided, results are filtered to
 * matching rows before ranking — rows with a NULL region/category are
 * treated as general-purpose and are not excluded by a filter (they simply
 * won't match a specific filter value, same as any other mismatch).
 */
export async function retrieveRelevantKnowledge(
  text: string,
  options: RagQueryOptions = {},
): Promise<string[]> {
  const embedding = await createEmbedding(text);
  const vectorLiteral = toVectorLiteral(embedding);
  const category = options.category ?? null;
  const region = options.region ?? null;

  const rows = await prisma.$queryRaw<KnowledgeChunkRow[]>`
    SELECT content
    FROM "KnowledgeChunk"
    WHERE
      (${category}::text IS NULL OR category IS NULL OR category = ${category})
      AND (${region}::text IS NULL OR region IS NULL OR region = ${region})
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${TOP_K}
  `;

  return rows.map((row) => row.content);
}