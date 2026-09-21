import type { NewsArticle } from "../src/types/news";

const sourceSuffixPattern = /\s[-–—]\s[^-–—]{2,30}$/u;

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/\s+/gu, " ")
    .trim();
}

export function removeSourceSuffix(title: string, source?: string) {
  const cleaned = stripHtml(title);
  if (source) {
    const suffixes = [` - ${source}`, ` – ${source}`, ` — ${source}`];
    const matched = suffixes.find((suffix) => cleaned.endsWith(suffix));
    if (matched) return cleaned.slice(0, -matched.length).trim();
  }
  return cleaned.replace(sourceSuffixPattern, "").trim();
}

export function normalizeTitle(title: string) {
  return removeSourceSuffix(title)
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\[[^\]]*\]|\([^)]*\)/gu, " ")
    .replace(/[^0-9a-z가-힣]/gu, "")
    .replace(/(단독|속보|종합|영상|포토)/gu, "")
    .trim();
}

function bigrams(value: string) {
  const normalized = normalizeTitle(value);
  if (normalized.length < 2) return new Set([normalized]);
  const result = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
}

export function titleSimilarity(left: string, right: string) {
  const leftNormalized = normalizeTitle(left);
  const rightNormalized = normalizeTitle(right);
  if (leftNormalized === rightNormalized) return 1;
  if (leftNormalized.length < 8 || rightNormalized.length < 8) return 0;

  const leftBigrams = bigrams(leftNormalized);
  const rightBigrams = bigrams(rightNormalized);
  let overlap = 0;
  leftBigrams.forEach((item) => {
    if (rightBigrams.has(item)) overlap += 1;
  });
  return (2 * overlap) / (leftBigrams.size + rightBigrams.size);
}

export function isLikelyDuplicate(
  left: Pick<NewsArticle, "title" | "url">,
  right: Pick<NewsArticle, "title" | "url">,
) {
  if (left.url === right.url) return true;
  return titleSimilarity(left.title, right.title) >= 0.72;
}

export function deduplicateArticles<T extends Pick<NewsArticle, "title" | "url" | "publishedAt">>(
  articles: T[],
) {
  const sorted = [...articles].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
  const unique: T[] = [];

  sorted.forEach((candidate) => {
    if (!unique.some((article) => isLikelyDuplicate(article, candidate))) {
      unique.push(candidate);
    }
  });

  return unique;
}
