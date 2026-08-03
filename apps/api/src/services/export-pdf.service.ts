import PDFDocument from "pdfkit";
import type { PlanContent } from "types"; // ⚠️ confirm this matches packages/types' actual name

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
 * Builds a PDF from plan content and returns the PDFKit document — a
 * readable stream ready to pipe directly to an HTTP response. Nothing is
 * written to disk.
 */
export function buildPlanPdf(content: PlanContent): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50 });

  doc.info.Title = "BuildPlanr Business Plan";
  doc.info.Author = "BuildPlanr";

  doc.fontSize(20).text("BuildPlanr Business Plan", { align: "center" });
  doc.moveDown(1.5);

  (Object.keys(SECTION_TITLES) as Array<keyof PlanContent>).forEach((key, index) => {
    if (index > 0) doc.moveDown(1);
    doc.fontSize(14).text(SECTION_TITLES[key], { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(content[key]);
  });

  doc.end();
  return doc;
}