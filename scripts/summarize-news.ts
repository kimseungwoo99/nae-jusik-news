import type { NewsArticle } from "../src/types/news";
import { removeSourceSuffix, stripHtml } from "./normalize-news";

const categories: Array<{ name: string; keywords: string[] }> = [
  { name: "반도체", keywords: ["반도체", "hbm", "dram", "낸드", "메모리", "파운드리"] },
  { name: "실적", keywords: ["실적", "매출", "영업이익", "순이익", "전망", "컨센서스"] },
  { name: "투자", keywords: ["투자", "공장", "증설", "설비", "연구개발", "r&d"] },
  { name: "수급", keywords: ["외국인", "기관", "순매수", "순매도", "주가", "증시"] },
  { name: "자동차", keywords: ["자동차", "전기차", "하이브리드", "판매", "신차", "suv"] },
  { name: "기술", keywords: ["ai", "인공지능", "소프트웨어", "로봇", "자율주행", "기술"] },
  { name: "산업", keywords: ["수출", "공급망", "시장", "정책", "협력", "생산"] },
];

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength).replace(/\s+\S*$/u, "").trim();
  return `${shortened || value.slice(0, maxLength).trim()}…`;
}

export function categorizeNews(title: string, description = "") {
  const haystack = `${title} ${stripHtml(description)}`.toLocaleLowerCase("ko-KR");
  return (
    categories.find((category) =>
      category.keywords.some((keyword) => haystack.includes(keyword)),
    )?.name ?? "기업"
  );
}

export function summarizeArticle(title: string, description = "", source = "") {
  const cleanTitle = removeSourceSuffix(title, source);
  const cleanDescription = stripHtml(description)
    .replace(cleanTitle, "")
    .replace(source, "")
    .replace(/Google 뉴스에서 전체 콘텐츠 보기/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

  if (cleanDescription.length >= 28) {
    return truncate(cleanDescription, 118);
  }

  return `${truncate(cleanTitle, 92)} 관련 내용이 보도됐습니다. 기사에서 자세한 내용을 확인할 수 있습니다.`;
}

export function summarizeDaily(stockName: string, articles: NewsArticle[]) {
  if (articles.length === 0) {
    return {
      brief: `현재 ${stockName}의 새 뉴스가 없습니다. 다음 업데이트 때 다시 확인해 주세요.`,
      points: [] as string[],
    };
  }

  const categoryNames = [...new Set(articles.map((article) => article.category))].slice(0, 2);
  const focus = categoryNames.join(" 및 ");
  const points = articles.slice(0, 3).map((article) => truncate(article.title, 52));

  return {
    brief: `오늘은 ${focus || "기업 동향"} 관련 보도가 주요 소식입니다. 아래 기사에서 내용을 확인해 보세요.`,
    points,
  };
}
