import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import OpenAI from "openai";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});


const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
    apiKey,
});

interface SeedChunk {
  sourceName: string;
  sourceUrl: string | null;
  category: string;
  region: string | null;
  content: string;
}

const seedChunks: SeedChunk[] = [
  // --- food ---
  {
    sourceName: "CAC Business Name Registration - Food Businesses",
    sourceUrl: "https://www.cac.gov.ng",
    category: "food",
    region: null,
    content:
      "Food businesses in Nigeria typically start with CAC Business Name registration before scaling to a full limited company. Registration involves reserving a business name, submitting owner details, and paying a registration fee that is generally in the tens of thousands of naira range. Processing is usually completed within a few business days via the CAC online portal.",
  },
  {
    sourceName: "NAFDAC Registration Requirement - Food Products",
    sourceUrl: "https://www.nafdac.gov.ng",
    category: "food",
    region: null,
    content:
      "Any business producing, packaging, or selling food, beverages, or bottled water in Nigeria is required to register the product with NAFDAC before legal sale. This involves facility inspection and product-specific labeling compliance. Timelines can range from several weeks to a few months depending on product category. A food business plan that omits NAFDAC registration is considered incomplete.",
  },
  {
    sourceName: "FIRS Tax Basics for Food SMEs",
    sourceUrl: "https://www.firs.gov.ng",
    category: "food",
    region: null,
    content:
      "Food SMEs registered with FIRS are subject to VAT at 7.5% on applicable goods and services, and Company Income Tax (CIT) once turnover exceeds the small-company exemption threshold. Businesses below that threshold may be exempt from CIT but should still obtain a Tax Identification Number (TIN) early, as it is often required for business banking and supplier contracts.",
  },

  // --- retail ---
  {
    sourceName: "CAC Business Name Registration - Retail Businesses",
    sourceUrl: "https://www.cac.gov.ng",
    category: "retail",
    region: null,
    content:
      "Retail and general trading businesses register with CAC the same way as most SMEs: Business Name registration for sole proprietors, or full LLC registration for those seeking limited liability or planning to raise investment. Business Name registration is the faster and cheaper starting point for most first-time retail founders.",
  },
  {
    sourceName: "LGA Business Premises Permit - Retail Shops",
    sourceUrl: null,
    category: "retail",
    region: null,
    content:
      "Any physical retail shop, kiosk, or storefront is generally required to register with the Local Government Area (LGA) where it operates, obtaining a business premises permit and paying an associated levy. This is a commonly overlooked step but is actively enforced in many states, particularly for storefront and signage compliance.",
  },
  {
    sourceName: "FIRS Tax Obligations for Retail SMEs",
    sourceUrl: "https://www.firs.gov.ng",
    category: "retail",
    region: null,
    content:
      "Retail businesses collecting VAT from customers (7.5% on applicable goods) are expected to remit this to FIRS on a regular filing schedule. State-level taxes and levies, collected by the relevant State Internal Revenue Service, may also apply and vary significantly between states such as Lagos and smaller states.",
  },

  // --- services ---
  {
    sourceName: "CAC Business Name Registration - Service Businesses",
    sourceUrl: "https://www.cac.gov.ng",
    category: "services",
    region: null,
    content:
      "Service-based businesses (consulting, logistics, education, professional services) follow the standard CAC registration path: Business Name for solo or small operators, LLC registration for those planning to hire staff, seek funding, or formalize liability protection. No industry-specific licensing is typically required beyond general business registration unless the service is separately regulated (e.g. financial services).",
  },
  {
    sourceName: "FIRS PAYE Obligations When Hiring Staff",
    sourceUrl: "https://www.firs.gov.ng",
    category: "services",
    region: null,
    content:
      "Once a service business hires employees, it becomes responsible for deducting and remitting Pay-As-You-Earn (PAYE) personal income tax on their behalf to the relevant State Internal Revenue Service, not FIRS directly. This obligation begins with the first hire and requires registering as an employer with the state tax authority.",
  },
  {
    sourceName: "SMEDAN MSME Registration and Support Programs",
    sourceUrl: "https://smedan.gov.ng",
    category: "services",
    region: null,
    content:
      "SMEDAN is not a regulator but a support agency offering MSME registration, training programs, and links to grant and cluster funding opportunities. Registration is free or low-cost and is worth completing early, as it can improve access to government-backed support programs later, independent of a business's CAC registration status.",
  },
];

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function getEmbedding(text: string): Promise<number[]> {
    
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
    
  const { prisma } = await import("../src/config/prisma");

  let inserted = 0;
  let skipped = 0;

  for (const chunk of seedChunks) {

    console.log(`Processing: ${chunk.sourceName}`);

    const existing = await prisma.knowledgeChunk.findFirst({
      where: { sourceName: chunk.sourceName },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const embedding = await getEmbedding(chunk.content);
    const vectorLiteral = toVectorLiteral(embedding);
    const id = randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" (id, "sourceName", "sourceUrl", category, region, content, embedding, "createdAt")
      VALUES (${id}, ${chunk.sourceName}, ${chunk.sourceUrl}, ${chunk.category}, ${chunk.region}, ${chunk.content}, ${vectorLiteral}::vector, now())
    `;

    inserted++;
  }

  console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped (already existed).`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });