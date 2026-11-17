export type Category = "All" | "Markets" | "Startups" | "Technology" | "Career" | "Learning";

export type IntelligenceItem = {
  id: string;
  category: Exclude<Category, "All">;
  eyebrow: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  readTime: string;
  signal: "High signal" | "Worth watching" | "Explainer";
  featured?: boolean;
  url: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageCredit?: string | null;
  imageSourceUrl?: string | null;
  imageLicense?: string | null;
  imageLicenseUrl?: string | null;
};
