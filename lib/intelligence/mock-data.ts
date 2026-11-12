import type { IntelligenceItem } from "@/types/intelligence";

// Clearly labelled sample content for the interface prototype.
// Replace with verified, source-linked records from the OSA ingestion pipeline.
export const intelligenceItems: IntelligenceItem[] = [
  {
    id: "market-001",
    category: "Markets",
    eyebrow: "MARKET STRUCTURE",
    title: "The infrastructure layer behind tokenised assets",
    summary: "A closer look at custody, settlement and institutional rails shaping the next phase of digital asset markets.",
    source: "OSA Research Preview",
    publishedAt: "Sample brief",
    readTime: "6 min read",
    signal: "High signal",
    featured: true,
    url: "#"
  },
  {
    id: "startup-001",
    category: "Startups",
    eyebrow: "VENTURE CAPITAL",
    title: "What investors look for before a company scales",
    summary: "Understand distribution, retention, unit economics and the evidence behind an early-stage investment thesis.",
    source: "OSA Research Preview",
    publishedAt: "Sample brief",
    readTime: "8 min read",
    signal: "Worth watching",
    url: "#"
  },
  {
    id: "tech-001",
    category: "Technology",
    eyebrow: "EMERGING TECHNOLOGY",
    title: "AI agents are moving from demos into workflows",
    summary: "The practical shift is not another chatbot. It is software that can complete bounded tasks, use tools and report its work.",
    source: "OSA Research Preview",
    publishedAt: "Sample brief",
    readTime: "5 min read",
    signal: "High signal",
    url: "#"
  },
  {
    id: "career-001",
    category: "Career",
    eyebrow: "GLOBAL CAREERS",
    title: "The operating skills that travel across financial markets",
    summary: "Trade lifecycle knowledge, controls, reconciliations and clear communication remain useful across global financial centres.",
    source: "OSA Research Preview",
    publishedAt: "Sample brief",
    readTime: "7 min read",
    signal: "Worth watching",
    url: "#"
  },
  {
    id: "learning-001",
    category: "Learning",
    eyebrow: "SKILL BUILDER",
    title: "Build financial modelling judgement, not just spreadsheet speed",
    summary: "A practical learning path from accounting foundations to forecasts, valuation and investment decisions.",
    source: "OSA Research Preview",
    publishedAt: "Sample brief",
    readTime: "9 min read",
    signal: "Explainer",
    url: "#"
  }
];
