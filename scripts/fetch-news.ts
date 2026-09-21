import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import type {
  NewsArticle,
  NewsCollection,
  StockConfig,
  StockNewsCollection,
  StockReference,
} from "../src/types/news";
import {
  deduplicateArticles,
  isLikelyDuplicate,
  removeSourceSuffix,
  stripHtml,
} from "./normalize-news";
import { categorizeNews, summarizeArticle, summarizeDaily } from "./summarize-news";
import { analyzeNewsSentiment } from "../src/utils/newsAnalysis";

const rootDirectory = process.cwd();
const configPath = path.join(rootDirectory, "config", "stocks.json");
const dataDirectory = path.join(rootDirectory, "public", "data");
const maxArticlesPerFeed = 15;
const maxArticlesPerStock = 20;
const dryRun = process.argv.includes("--dry-run");

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  processEntities: true,
});

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: string | { "#text"?: string };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function readSource(source: RssItem["source"]) {
  if (typeof source === "string") return stripHtml(source);
  return stripHtml(source?.["#text"] ?? "알 수 없는 언론사");
}

function safeDate(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function makeArticleId(url: string, title: string) {
  return createHash("sha1").update(`${url}|${title}`).digest("hex").slice(0, 16);
}

function stockReference(stock: StockConfig): StockReference {
  return { id: stock.id, name: stock.name, ticker: stock.ticker };
}

function buildFeedUrl(keyword: string) {
  const query = encodeURIComponent(`${keyword} when:7d`);
  return `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
}

async function fetchFeed(keyword: string, stock: StockConfig, collectedAt: string) {
  const response = await fetch(buildFeedUrl(keyword), {
    headers: {
      "User-Agent": "nae-jusik-news/1.0 (personal RSS reader)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`RSS 요청 실패: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem | RssItem[] } };
  };
  const items = asArray(parsed.rss?.channel?.item).slice(0, maxArticlesPerFeed);

  return items.flatMap<NewsArticle>((item) => {
    const rawTitle = typeof item.title === "string" ? item.title : "";
    const url = typeof item.link === "string" ? item.link : "";
    if (!rawTitle || !/^https?:\/\//u.test(url)) return [];

    const source = readSource(item.source);
    const title = removeSourceSuffix(rawTitle, source);
    const publishedAt = safeDate(item.pubDate, collectedAt);
    const reference = stockReference(stock);
    const summary = summarizeArticle(title, item.description ?? "", source);

    return [
      {
        id: makeArticleId(url, title),
        title,
        source,
        url,
        publishedAt,
        collectedAt,
        stockId: stock.id,
        stock: stock.name,
        ticker: stock.ticker,
        relatedStocks: [reference],
        summary,
        category: categorizeNews(title, item.description ?? ""),
        sentiment: analyzeNewsSentiment(title, summary),
      },
    ];
  });
}

async function readExistingStock(stock: StockConfig) {
  try {
    const content = await readFile(path.join(dataDirectory, `${stock.id}.json`), "utf8");
    const parsed = JSON.parse(content) as StockNewsCollection;
    return parsed.articles;
  } catch {
    return [];
  }
}

function mergeAcrossStocks(stockArticles: Map<string, NewsArticle[]>) {
  const merged: NewsArticle[] = [];

  stockArticles.forEach((articles) => {
    articles.forEach((candidate) => {
      const existing = merged.find((article) => isLikelyDuplicate(article, candidate));
      if (!existing) {
        merged.push({ ...candidate, relatedStocks: [...candidate.relatedStocks] });
        return;
      }

      candidate.relatedStocks.forEach((reference) => {
        if (!existing.relatedStocks.some((stock) => stock.id === reference.id)) {
          existing.relatedStocks.push(reference);
        }
      });
    });
  });

  return merged.sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
}

async function writeJson(fileName: string, data: unknown) {
  await writeFile(
    path.join(dataDirectory, fileName),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const stocks = JSON.parse(await readFile(configPath, "utf8")) as StockConfig[];
  const collectedAt = new Date().toISOString();
  const stockArticles = new Map<string, NewsArticle[]>();
  let fetchedArticleCount = 0;

  await mkdir(dataDirectory, { recursive: true });

  for (const stock of stocks) {
    const fetched: NewsArticle[] = [];

    for (const keyword of stock.keywords) {
      try {
        const articles = await fetchFeed(keyword, stock, collectedAt);
        fetched.push(...articles);
        console.log(`${stock.name} / ${keyword}: ${articles.length}개 수집`);
      } catch (error) {
        console.warn(
          `${stock.name} / ${keyword}: 수집 실패 - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const unique = deduplicateArticles(fetched).slice(0, maxArticlesPerStock);
    fetchedArticleCount += unique.length;

    if (unique.length === 0) {
      const existing = await readExistingStock(stock);
      console.warn(`${stock.name}: 새 수집 결과가 없어 기존 ${existing.length}개 기사를 유지합니다.`);
      stockArticles.set(stock.id, existing);
    } else {
      stockArticles.set(stock.id, unique);
    }
  }

  if (fetchedArticleCount === 0) {
    throw new Error("모든 RSS 수집이 실패했습니다. 기존 데이터 파일은 변경하지 않았습니다.");
  }

  const allArticles = mergeAcrossStocks(stockArticles).map((article) => ({
    ...article,
    sentiment: analyzeNewsSentiment(article.title, article.summary),
  }));
  const allCollection: NewsCollection = {
    generatedAt: collectedAt,
    source: "google-news-rss",
    isMock: false,
    articles: allArticles,
  };

  if (dryRun) {
    console.log(
      `시험 완료: ${stocks.length}개 종목, 중복 제거 후 ${allArticles.length}개 기사 (파일은 변경하지 않음)`,
    );
    return;
  }

  await writeJson("all.json", allCollection);

  for (const stock of stocks) {
    const articles = allArticles
      .filter((article) => article.relatedStocks.some((item) => item.id === stock.id))
      .slice(0, maxArticlesPerStock);
    const daily = summarizeDaily(stock.name, articles);
    const collection: StockNewsCollection = {
      generatedAt: collectedAt,
      source: "google-news-rss",
      isMock: false,
      stock: stockReference(stock),
      dailyBrief: daily.brief,
      dailySummary: daily.points,
      articles,
    };
    await writeJson(`${stock.id}.json`, collection);
  }

  console.log(`완료: ${stocks.length}개 종목, 중복 제거 후 ${allArticles.length}개 기사`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
