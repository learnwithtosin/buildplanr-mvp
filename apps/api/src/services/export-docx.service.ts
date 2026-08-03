import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { PlanContent } from "types";

const SECTION_TITLES: Record<keyof PlanContent, string> = {
  executiveSummary: "Executive Summary",
  businessDescription: "Business Description",
  marketAnalysis: "Market Analysis",
  marketingStrategy: "Marketing Strategy",
  operationsPlan: "Operations Plan",
  financialPlan: "Financial Plan",
  startupCostEstimate: "Startup Cost Estimate",
  operatingCostEstimate: "Operating Cost Estimate",
  breakEvenEstimate: "Break-Even Estimate",
  cashFlowProjection: "Cash Flow Projection",
  regulatoryConsiderations: "Nigerian Regulatory Considerations",
  risks: "Risks",
  recommendations: "Recommendations",
};

/**
 * Builds a .docx from plan content and returns it as an in-memory Buffer —
 * nothing is written to disk.
 */
export async function buildPlanDocx(content: PlanContent): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: "BuildPlanr Business Plan", heading: HeadingLevel.TITLE }),
  ];

  (Object.keys(SECTION_TITLES) as Array<keyof PlanContent>).forEach((key) => {
    children.push(
      new Paragraph({ text: SECTION_TITLES[key], heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun(content[key])] })
    );
  });

  const doc = new Document({
    creator: "BuildPlanr",
    title: "BuildPlanr Business Plan",
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}