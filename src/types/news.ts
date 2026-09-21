export interface StockConfig {
  id: string;
  name: string;
  ticker: string;
  keywords: string[];
}

export type StockReference = Pick<StockConfig, "id" | "name" | "ticker">;

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  collectedAt: string;
  stockId: string;
  stock: string;
  ticker: string;
  relatedStocks: StockReference[];
  summary: string;
  category: string;
}

export interface NewsCollection {
  generatedAt: string;
  source: "mock" | "google-news-rss";
  isMock?: boolean;
  articles: NewsArticle[];
}

export interface StockNewsCollection extends NewsCollection {
  stock: StockReference;
  dailyBrief: string;
  dailySummary: string[];
}

export type FontSizePreference = "default" | "large" | "xlarge";
