import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { DailyBrief } from "../components/DailyBrief";
import { EmptyState, ErrorState, LoadingCards } from "../components/FeedbackState";
import { NewsCard } from "../components/NewsCard";
import { PageHeader } from "../components/PageHeader";
import { findStock } from "../config";
import { useNewsData } from "../context/NewsDataContext";
import type { StockNewsCollection } from "../types/news";
import { fetchStockNews } from "../utils/data";
import { formatUpdateTime } from "../utils/date";

type SortMode = "latest" | "important";

const priorityCategories = ["실적", "투자", "반도체", "산업", "기술"];

export function StockPage() {
  const { stockId } = useParams();
  const stock = findStock(stockId);
  const { isNewArticle } = useNewsData();
  const [collection, setCollection] = useState<StockNewsCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  useEffect(() => {
    if (!stock) return;
    const controller = new AbortController();
    let active = true;
    setCollection(null);
    setLoading(true);
    setError(null);

    fetchStockNews(stock.id, controller.signal)
      .then((result) => {
        if (active) setCollection(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "종목 뉴스를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, stock]);

  const articles = useMemo(() => {
    if (!collection) return [];
    const sorted = [...collection.articles];
    if (sortMode === "important") {
      return sorted.sort((left, right) => {
        const leftScore = priorityCategories.includes(left.category) ? 1 : 0;
        const rightScore = priorityCategories.includes(right.category) ? 1 : 0;
        return (
          rightScore - leftScore ||
          new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
        );
      });
    }
    return sorted.sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
    );
  }, [collection, sortMode]);

  if (!stock) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <PageHeader
        title={stock.name}
        description={`종목코드 ${stock.ticker}`}
        backTo="/"
      />

      {collection ? (
        <>
          <p className="inline-update">{formatUpdateTime(collection.generatedAt)}</p>
          <DailyBrief
            stockName={stock.name}
            brief={collection.dailyBrief}
            points={collection.dailySummary}
          />

          <div className="sort-control" aria-label="뉴스 정렬">
            <button
              type="button"
              className={sortMode === "latest" ? "is-active" : ""}
              aria-pressed={sortMode === "latest"}
              onClick={() => setSortMode("latest")}
            >
              최신순
            </button>
            <button
              type="button"
              className={sortMode === "important" ? "is-active" : ""}
              aria-pressed={sortMode === "important"}
              onClick={() => setSortMode("important")}
            >
              주요 뉴스 먼저
            </button>
          </div>
        </>
      ) : null}

      <section className="content-section" aria-labelledby="stock-news-list-title">
        <div className="section-heading compact">
          <h2 id="stock-news-list-title">{stock.name} 뉴스</h2>
          {collection ? <span className="section-count">{articles.length}개</span> : null}
        </div>

        {loading ? <LoadingCards /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        ) : null}
        {!loading && !error && articles.length === 0 ? (
          <EmptyState
            title="새로 들어온 뉴스가 없습니다"
            description="다음 자동 업데이트 때 다시 확인해 주세요."
          />
        ) : null}
        <div className="news-list">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isNew={isNewArticle(article.collectedAt)}
              showStock={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
