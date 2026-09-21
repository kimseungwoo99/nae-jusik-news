import assert from "node:assert/strict";
import test from "node:test";
import { deduplicateArticles, normalizeTitle, titleSimilarity } from "./normalize-news";

test("제목에서 기호와 속보 표현을 제거한다", () => {
  assert.equal(normalizeTitle("[속보] 삼성전자, HBM 투자 확대"), "삼성전자hbm투자확대");
});

test("비슷한 제목을 중복으로 판단할 수 있다", () => {
  const score = titleSimilarity(
    "삼성전자, 차세대 HBM 생산 확대 계획",
    "삼성전자 차세대 HBM 생산 확대 계획 발표",
  );
  assert.ok(score >= 0.72);
});

test("같은 URL의 기사는 하나만 남긴다", () => {
  const articles = deduplicateArticles([
    { title: "첫 번째 기사", url: "https://example.com/a", publishedAt: "2026-09-21T01:00:00Z" },
    { title: "다른 제목", url: "https://example.com/a", publishedAt: "2026-09-21T02:00:00Z" },
  ]);
  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, "다른 제목");
});
