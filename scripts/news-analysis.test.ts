import assert from "node:assert/strict";
import test from "node:test";
import { stocks } from "../src/config";
import type { NewsArticle } from "../src/types/news";
import {
  analyzeNewsSentiment,
  buildStockRelations,
  summarizeStockMood,
} from "../src/utils/newsAnalysis";

function article(
  id: string,
  title: string,
  source = "테스트경제",
  summary = "",
): NewsArticle {
  return {
    id,
    title,
    source,
    summary,
    url: `https://example.com/${id}`,
    publishedAt: "2026-09-21T08:00:00+09:00",
    collectedAt: "2026-09-21T09:00:00+09:00",
    stockId: "samsung",
    stock: "삼성전자",
    ticker: "005930",
    relatedStocks: [{ id: "samsung", name: "삼성전자", ticker: "005930" }],
    category: "기업",
  };
}

test("금융 뉴스의 긍정 표현을 분류한다", () => {
  const result = analyzeNewsSentiment(
    "삼성전자 영업익 80% 증가…실적 개선 기대감",
  );
  assert.equal(result.label, "positive");
  assert.ok(result.positiveTerms.includes("이익 증가"));
});

test("금융 뉴스의 부정 표현을 분류한다", () => {
  const result = analyzeNewsSentiment(
    "부품 공급 차질에 공장 생산 중단…실적 부진 우려",
  );
  assert.equal(result.label, "negative");
  assert.ok(result.negativeTerms.includes("생산 차질"));
});

test("방향 표현이 없는 뉴스는 중립으로 분류한다", () => {
  assert.equal(
    analyzeNewsSentiment("현대차, 새 디자인의 투싼 공개").label,
    "neutral",
  );
});

test("종목 전체 뉴스 분위기를 기사 수로 요약한다", () => {
  const articles = [
    article("p1", "영업익 증가로 실적 개선"),
    article("p2", "대규모 공급 계약 체결"),
    article("p3", "주가 급등 마감"),
    article("n1", "생산 중단 우려"),
  ];
  const mood = summarizeStockMood(articles);
  assert.equal(mood.label, "positive");
  assert.deepEqual(
    [mood.positive, mood.neutral, mood.negative],
    [3, 0, 1],
  );
});

test("함께 등장한 회사와 기술을 기사 근거와 함께 찾는다", () => {
  const samsung = stocks.find((stock) => stock.id === "samsung");
  assert.ok(samsung);
  const articles = [
    article("r1", "삼성전자·SK하이닉스, HBM 투자 확대", "경제일보"),
    article("r2", "삼성전자 HBM 공급 경쟁", "산업신문", "인텔과 협력 가능성도 언급됐다."),
  ];
  const relations = buildStockRelations(samsung, articles);
  const hbm = relations.find((relation) => relation.id === "hbm");
  const intel = relations.find((relation) => relation.id === "intel");
  const hynix = relations.find((relation) => relation.id === "stock-skhynix");

  assert.equal(hbm?.articleCount, 2);
  assert.deepEqual(intel?.articleIds, ["r2"]);
  assert.equal(hynix?.articleCount, 1);
});
