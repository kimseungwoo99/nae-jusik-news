import entitiesJson from "../../config/entities.json";
import { stocks } from "../config";
import type {
  NewsArticle,
  NewsSentiment,
  NewsSentimentLabel,
  StockConfig,
} from "../types/news";

interface SentimentRule {
  label: string;
  pattern: RegExp;
  weight: number;
}

export type RelationType = "company" | "theme" | "region";

interface NewsEntityConfig {
  id: string;
  name: string;
  type: RelationType;
  aliases: string[];
}

export interface NewsRelation {
  id: string;
  name: string;
  type: RelationType;
  articleCount: number;
  sourceCount: number;
  articleIds: string[];
}

export type StockMoodLabel = NewsSentimentLabel | "mixed";

export interface StockMood {
  label: StockMoodLabel;
  headline: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  evidence: string[];
}

const positiveRules: SentimentRule[] = [
  { label: "급등", pattern: /급등|폭등/u, weight: 2.2 },
  { label: "강세", pattern: /강세|상승 마감|신고가/u, weight: 1.7 },
  { label: "반등", pattern: /반등|상승 전환/u, weight: 1.5 },
  { label: "흑자 전환", pattern: /흑자\s*전환/u, weight: 2.2 },
  {
    label: "이익 증가",
    pattern: /(영업이익|영업익|순이익).{0,14}(증가|늘어|상승|상향)/u,
    weight: 1.9,
  },
  {
    label: "매출 성장",
    pattern: /매출.{0,14}(증가|성장|상승|확대|최대)/u,
    weight: 1.6,
  },
  { label: "실적 개선", pattern: /실적.{0,10}(개선|호조|회복|상향)/u, weight: 1.7 },
  { label: "수주", pattern: /수주|공급\s*계약|계약\s*체결/u, weight: 1.5 },
  {
    label: "점유율 상승",
    pattern: /점유율.{0,12}(상승|확대|1위)|1위.{0,8}(탈환|유지)/u,
    weight: 1.6,
  },
  { label: "투자 확대", pattern: /투자\s*확대|증설|생산\s*확대/u, weight: 1.2 },
  { label: "기대감", pattern: /기대감|청신호|상향\s*전망/u, weight: 1.1 },
  { label: "성과", pattern: /사상\s*최대|역대\s*최대|돌파|성공/u, weight: 1.4 },
];

const negativeRules: SentimentRule[] = [
  { label: "급락", pattern: /급락|폭락/u, weight: 2.2 },
  { label: "약세", pattern: /약세|하락\s*마감|신저가/u, weight: 1.7 },
  { label: "적자", pattern: /적자\s*전환|영업\s*적자|순손실/u, weight: 2.1 },
  {
    label: "이익 감소",
    pattern: /(영업이익|영업익|순이익).{0,14}(감소|하락|축소|급감)/u,
    weight: 1.9,
  },
  {
    label: "매출 감소",
    pattern: /매출.{0,14}(감소|하락|축소|급감)/u,
    weight: 1.6,
  },
  { label: "실적 부진", pattern: /실적.{0,10}(악화|부진|하향)/u, weight: 1.7 },
  { label: "생산 차질", pattern: /생산\s*중단|가동\s*중단|공급\s*차질/u, weight: 1.8 },
  { label: "리콜·결함", pattern: /리콜|결함/u, weight: 1.6 },
  { label: "수사·소송", pattern: /수사|고발|소송|횡령|배임/u, weight: 1.9 },
  { label: "고용 문제", pattern: /해고|고용\s*불안|산재|차별/u, weight: 1.6 },
  { label: "논란", pattern: /의혹|논란|불신임/u, weight: 1.3 },
  { label: "우려", pattern: /우려|위기|불확실|경고/u, weight: 1.2 },
  { label: "전망 하향", pattern: /하향\s*전망|목표가\s*하향/u, weight: 1.5 },
  { label: "지연·실패", pattern: /지연|무산|실패|제재/u, weight: 1.4 },
];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function uniqueMatches(text: string, rules: SentimentRule[]) {
  return rules.filter((rule) => rule.pattern.test(text));
}

export function analyzeNewsSentiment(title: string, summary = ""): NewsSentiment {
  const text = `${title} ${summary}`.replace(/\s+/gu, " ");
  const positive = uniqueMatches(text, positiveRules);
  const negative = uniqueMatches(text, negativeRules);
  const positiveWeight = positive.reduce((sum, rule) => sum + rule.weight, 0);
  const negativeWeight = negative.reduce((sum, rule) => sum + rule.weight, 0);
  const rawScore = positiveWeight - negativeWeight;
  const matchedWeight = positiveWeight + negativeWeight;
  const label: NewsSentimentLabel =
    rawScore > 0.45 ? "positive" : rawScore < -0.45 ? "negative" : "neutral";

  return {
    label,
    score: round(Math.max(-1, Math.min(1, rawScore / 4))),
    confidence: round(Math.min(0.95, matchedWeight === 0 ? 0.35 : 0.48 + matchedWeight / 8)),
    positiveTerms: positive.map((rule) => rule.label),
    negativeTerms: negative.map((rule) => rule.label),
  };
}

export function getArticleSentiment(article: NewsArticle) {
  const stored = article.sentiment;
  if (
    stored &&
    ["positive", "neutral", "negative"].includes(stored.label) &&
    Number.isFinite(stored.score)
  ) {
    return stored;
  }
  return analyzeNewsSentiment(article.title, article.summary);
}

function topEvidence(sentiments: NewsSentiment[]) {
  const counts = new Map<string, number>();
  sentiments.forEach((sentiment) => {
    [...sentiment.positiveTerms, ...sentiment.negativeTerms].forEach((term) => {
      counts.set(term, (counts.get(term) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ko"))
    .slice(0, 4)
    .map(([term]) => term);
}

export function summarizeStockMood(articles: NewsArticle[]): StockMood {
  const sentiments = articles.map(getArticleSentiment);
  const positive = sentiments.filter((item) => item.label === "positive").length;
  const neutral = sentiments.filter((item) => item.label === "neutral").length;
  const negative = sentiments.filter((item) => item.label === "negative").length;
  const difference = positive - negative;
  const threshold = Math.max(2, Math.ceil(articles.length * 0.15));

  let label: StockMoodLabel = "neutral";
  let headline = "중립적인 표현의 기사가 많아요";

  if (difference >= threshold) {
    label = "positive";
    headline = "긍정적인 표현의 기사가 조금 더 많아요";
  } else if (difference <= -threshold) {
    label = "negative";
    headline = "부정적인 표현의 기사가 조금 더 많아요";
  } else if (positive > 0 && negative > 0) {
    label = "mixed";
    headline = "긍정과 부정 표현이 함께 나타나요";
  } else if (articles.length === 0) {
    headline = "분석할 뉴스가 아직 없어요";
  }

  return {
    label,
    headline,
    total: articles.length,
    positive,
    neutral,
    negative,
    evidence: topEvidence(sentiments),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function includesAlias(text: string, alias: string) {
  const normalizedText = text.toLocaleLowerCase("ko-KR");
  const normalizedAlias = alias.trim().toLocaleLowerCase("ko-KR");
  if (!normalizedAlias) return false;
  if (/^[a-z0-9][a-z0-9+.-]*$/u.test(normalizedAlias)) {
    return new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normalizedAlias)}([^a-z0-9]|$)`,
      "u",
    ).test(normalizedText);
  }
  return normalizedText.includes(normalizedAlias);
}

function stockEntity(stock: StockConfig): NewsEntityConfig {
  return {
    id: `stock-${stock.id}`,
    name: stock.name,
    type: "company",
    aliases: stock.aliases?.length ? stock.aliases : [stock.name],
  };
}

const configuredEntities = entitiesJson as NewsEntityConfig[];

export function buildStockRelations(
  stock: StockConfig,
  articles: NewsArticle[],
): NewsRelation[] {
  const entities = [
    ...stocks.filter((item) => item.id !== stock.id).map(stockEntity),
    ...configuredEntities,
  ];

  return entities
    .flatMap<NewsRelation>((entity) => {
      const matchingArticles = articles.filter((article) => {
        const text = `${article.title} ${article.summary}`;
        return entity.aliases.some((alias) => includesAlias(text, alias));
      });
      if (matchingArticles.length === 0) return [];

      return [{
        id: entity.id,
        name: entity.name,
        type: entity.type,
        articleCount: matchingArticles.length,
        sourceCount: new Set(matchingArticles.map((article) => article.source)).size,
        articleIds: matchingArticles.map((article) => article.id),
      }];
    })
    .sort(
      (left, right) =>
        right.articleCount - left.articleCount ||
        right.sourceCount - left.sourceCount ||
        left.name.localeCompare(right.name, "ko"),
    );
}
