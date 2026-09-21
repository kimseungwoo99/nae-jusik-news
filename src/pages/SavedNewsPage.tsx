import { EmptyState } from "../components/FeedbackState";
import { NewsCard } from "../components/NewsCard";
import { PageHeader } from "../components/PageHeader";
import { useBookmarks } from "../hooks/useBookmarks";

export function SavedNewsPage() {
  const { bookmarks } = useBookmarks();

  return (
    <div className="page">
      <PageHeader
        title="저장한 뉴스"
        description="나중에 다시 볼 기사를 이 기기에 보관합니다."
        backTo="/settings"
      />

      <section className="content-section" aria-labelledby="saved-list-title">
        <div className="section-heading compact">
          <h2 id="saved-list-title">저장 목록</h2>
          <span className="section-count">{bookmarks.length}개</span>
        </div>

        {bookmarks.length === 0 ? (
          <EmptyState
            title="저장한 뉴스가 없습니다"
            description="뉴스 카드의 ‘저장’ 버튼을 누르면 여기에 모아 볼 수 있습니다."
          />
        ) : null}

        <div className="news-list">
          {bookmarks.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
