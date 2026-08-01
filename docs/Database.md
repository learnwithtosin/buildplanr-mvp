# Database.md

PostgreSQL via Prisma, with the `pgvector` extension. No `User` table — a plan is addressed by its own UUID.

## Enums

```prisma
enum PlanStatus {
  awaiting_answers
  processing
  completed
  failed
}
```

## `BusinessPlan`

```prisma
model BusinessPlan {
  id               String     @id @default(uuid())
  businessIdea     String
  industryCategory String?
  region           String?
  questionnaire    Json
  answers          Json?
  status           PlanStatus @default(awaiting_answers)
  content          Json?
  modelUsed        String?
  generatedAt      DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  @@index([status])
}
```

## `KnowledgeChunk`

```prisma
model KnowledgeChunk {
  id         String                  @id @default(uuid())
  sourceName String
  sourceUrl  String?
  category   String
  region     String?
  content    String
  embedding  Unsupported("vector(1536)")?
  createdAt  DateTime                @default(now())

  @@index([category])
  @@index([region])
}
```

## Relationships

None. `KnowledgeChunk` is a standalone, standing knowledge base — queried by similarity search at generation time, not foreign-keyed to `BusinessPlan`.

## Indexes

- `BusinessPlan.status` — supports status-filtered queries.
- `KnowledgeChunk.category`, `KnowledgeChunk.region` — support filtered retrieval before the vector similarity search.
- No vector index (e.g. `ivfflat`/`hnsw`) yet — unnecessary at MVP data volume; a sequential scan over `KnowledgeChunk` is fast enough. Add one only if retrieval latency becomes a real problem.

## Future (Not MVP)

Not implemented, not to be added without a scope decision:
- `User` — if accounts are ever introduced.
- `PlanSourceLink` — join table logging which `KnowledgeChunk` rows informed which plan, for prompt-quality debugging.