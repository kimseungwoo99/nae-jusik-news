import type { NewsCollection, StockNewsCollection } from "../types/news";

const dataBaseUrl = `${import.meta.env.BASE_URL}data/`;

async function getJson<T>(fileName: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${dataBaseUrl}${fileName}`, {
    cache: "no-cache",
    signal,
  });

  if (!response.ok) {
    throw new Error(`뉴스 데이터를 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as T;
}

export function fetchAllNews(signal?: AbortSignal) {
  return getJson<NewsCollection>("all.json", signal);
}

export function fetchStockNews(stockId: string, signal?: AbortSignal) {
  return getJson<StockNewsCollection>(`${stockId}.json`, signal);
}
