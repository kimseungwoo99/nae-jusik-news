import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ErrorState, LoadingCards, EmptyState } from "../components/FeedbackState";
import { NewsCard } from "../components/NewsCard";
import { PageHeader } from "../components/PageHeader";
import { stocks } from "../config";
import { useNewsData } from "../context/NewsDataContext";
import { formatUpdateTime } from "../utils/date";

export function AllNewsPage() {
  const { data, loading, error, isNewArticle, retry } = useNewsData();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStock = searchParams.get("stock") ?? "all";

  const articles = useMemo(() => {
    if (!data) return [];
    if (selectedStock === "all") return data.articles;
    return data.articles.filter((article) =>
      article.relatedStocks.some((stock) => stock.id === selectedStock),
    );
  }, [data, selectedStock]);

  const selectStock = (stockId: string) => {
    setSearchParams(stockId === "all" ? {} : { stock: stockId });
  };

  return (
    <div className="page">
      <PageHeader
        title="전체 뉴스"
        description="관심 종목의 기사를 최신순으로 모았습니다."
      />

      {data ? <p className="inline-update">{formatUpdateTime(data.generatedAt)}</p> : null}

      <div className="filter-scroller" aria-label="종목별 뉴스 필터">
        <button
          type="button"
          className={selectedStock === "all" ? "is-active" : ""}
          aria-pressed={selectedStock === "all"}
          onClick={() => selectStock("all")}
        >
          전체
        </button>
        {stocks.map((stock) => (
          <button
            type="button"
            key={stock.id}
            className={selectedStock === stock.id ? "is-active" : ""}
            aria-pressed={selectedStock === stock.id}
            onClick={() => selectStock(stock.id)}
          >
            {stock.name}
          </button>
        ))}
      </div>

      <section className="content-section" aria-labelledby="all-news-list-title">
        <div className="section-heading compact">
          <h2 id="all-news-list-title">최신 뉴스</h2>
          {!loading && !error ? <span className="section-count">{articles.length}개</span> : null}
        </div>

        {loading ? <LoadingCards /> : null}
        {error ? <ErrorState message={error} onRetry={retry} /> : null}
        {!loading && !error && articles.length === 0 ? (
          <EmptyState
            title="표시할 뉴스가 없습니다"
            description="다른 종목을 선택하거나 다음 업데이트를 기다려 주세요."
          />
        ) : null}
        <div className="news-list">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isNew={isNewArticle(article.collectedAt)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
