import {
  BookmarkSimple,
  Clock,
  NewspaperClipping,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingCards } from "../components/FeedbackState";
import { NewsCard } from "../components/NewsCard";
import { SearchField } from "../components/SearchField";
import { StockCard } from "../components/StockCard";
import { stocks } from "../config";
import { useNewsData } from "../context/NewsDataContext";
import { useBookmarks } from "../hooks/useBookmarks";
import { formatUpdateTime, isTodayInSeoul } from "../utils/date";

export function HomePage() {
  const [query, setQuery] = useState("");
  const { data, loading, error, isNewArticle, retry } = useNewsData();
  const { bookmarks } = useBookmarks();
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  const filteredStocks = useMemo(
    () =>
      stocks.filter((stock) =>
        `${stock.name} ${stock.ticker} ${stock.keywords.join(" ")}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const searchResults = useMemo(() => {
    if (!normalizedQuery || !data) return [];
    return data.articles.filter((article) =>
      [
        article.title,
        article.summary,
        article.stock,
        article.ticker,
        article.source,
        article.category,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery),
    );
  }, [data, normalizedQuery]);

  const newTotal = data
    ? data.articles.filter((article) => isNewArticle(article.collectedAt)).length
    : 0;

  return (
    <div className="page home-page">
      <header className="home-header">
        <div className="brand-row">
          <span className="app-mark" aria-hidden="true">
            <NewspaperClipping size={30} weight="fill" />
          </span>
          <div>
            <p className="eyebrow">쉽게 보는 우리 가족 주식 소식</p>
            <h1 tabIndex={-1}>내 주식 뉴스</h1>
          </div>
        </div>

        {data ? (
          <div className="update-row">
            <Clock size={21} weight="bold" aria-hidden="true" />
            <span>{formatUpdateTime(data.generatedAt)}</span>
            {newTotal > 0 ? <strong>새 뉴스 {newTotal}개</strong> : null}
          </div>
        ) : null}
      </header>

      <SearchField value={query} onChange={setQuery} />

      {data?.isMock ? (
        <div className="sample-notice" role="note">
          <strong>화면 확인용 예시 뉴스입니다.</strong>
          <span>자동 뉴스 업데이트가 실행되면 실제 기사로 바뀝니다.</span>
        </div>
      ) : null}

      {normalizedQuery ? (
        <section className="content-section" aria-labelledby="search-results-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">검색</p>
              <h2 id="search-results-title">검색 결과 {searchResults.length}개</h2>
            </div>
          </div>

          {loading ? <LoadingCards /> : null}
          {error ? <ErrorState message={error} onRetry={retry} /> : null}
          {!loading && !error && searchResults.length === 0 ? (
            <EmptyState
              title="찾은 뉴스가 없습니다"
              description="종목명이나 더 짧은 단어로 다시 검색해 보세요."
            />
          ) : null}
          <div className="news-list">
            {searchResults.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isNew={isNewArticle(article.collectedAt)}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="content-section" aria-labelledby="watchlist-title">
            <div className="section-heading">
              <div>
                <p className="section-kicker">관심 종목</p>
                <h2 id="watchlist-title">어떤 뉴스를 볼까요?</h2>
              </div>
              <span className="section-count">{stocks.length}개 종목</span>
            </div>

            {loading ? <LoadingCards count={3} /> : null}
            {error ? <ErrorState message={error} onRetry={retry} /> : null}
            {!loading && !error && data ? (
              <div className="stock-list">
                {filteredStocks.map((stock) => {
                  const articles = data.articles.filter((article) =>
                    article.relatedStocks.some((related) => related.id === stock.id),
                  );
                  const todayCount = articles.filter((article) =>
                    isTodayInSeoul(article.publishedAt),
                  ).length;
                  const newCount = articles.filter((article) =>
                    isNewArticle(article.collectedAt),
                  ).length;

                  return (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      articleCount={articles.length}
                      todayCount={todayCount}
                      newCount={newCount}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>

          {bookmarks.length > 0 ? (
            <Link className="saved-shortcut" to="/saved">
              <span className="saved-shortcut__icon" aria-hidden="true">
                <BookmarkSimple size={25} weight="fill" />
              </span>
              <span>
                <strong>저장한 뉴스</strong>
                <small>나중에 읽을 기사 {bookmarks.length}개</small>
              </span>
              <span className="saved-shortcut__action">모아보기</span>
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
