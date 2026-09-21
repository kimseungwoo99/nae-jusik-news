import {
  ArrowSquareOut,
  BookmarkSimple,
  Check,
} from "@phosphor-icons/react";
import { useBookmarks } from "../hooks/useBookmarks";
import type { NewsArticle } from "../types/news";
import { formatArticleTime } from "../utils/date";

interface NewsCardProps {
  article: NewsArticle;
  isNew?: boolean;
  showStock?: boolean;
}

export function NewsCard({
  article,
  isNew = false,
  showStock = true,
}: NewsCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(article.id);

  return (
    <article className="news-card">
      <div className="news-card__labels">
        {showStock ? <span className="stock-label">{article.stock}</span> : null}
        <span className="category-label">{article.category}</span>
        {isNew ? <span className="new-label">새 뉴스</span> : null}
      </div>

      <h3>{article.title}</h3>

      <p className="news-card__meta">
        <strong>{article.source}</strong>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt}>
          {formatArticleTime(article.publishedAt)}
        </time>
      </p>

      <p className="news-card__summary">{article.summary}</p>

      <div className="news-card__actions">
        <button
          type="button"
          className={`secondary-button${saved ? " is-saved" : ""}`}
          aria-pressed={saved}
          onClick={() => toggleBookmark(article)}
        >
          {saved ? (
            <Check size={22} weight="bold" aria-hidden="true" />
          ) : (
            <BookmarkSimple size={22} weight="bold" aria-hidden="true" />
          )}
          <span>{saved ? "저장됨" : "저장"}</span>
        </button>
        <a
          className="primary-button"
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>기사 보기</span>
          <ArrowSquareOut size={22} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
