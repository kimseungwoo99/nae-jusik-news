import { useCallback } from "react";
import type { NewsArticle } from "../types/news";
import { useLocalStorage } from "./useLocalStorage";

const BOOKMARKS_KEY = "stock-news-bookmarks";
const EMPTY_BOOKMARKS: NewsArticle[] = [];

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<NewsArticle[]>(
    BOOKMARKS_KEY,
    EMPTY_BOOKMARKS,
  );

  const isBookmarked = useCallback(
    (articleId: string) => bookmarks.some((article) => article.id === articleId),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (article: NewsArticle) => {
      setBookmarks((current) => {
        const exists = current.some((item) => item.id === article.id);
        return exists
          ? current.filter((item) => item.id !== article.id)
          : [article, ...current];
      });
    },
    [setBookmarks],
  );

  return { bookmarks, isBookmarked, toggleBookmark };
}
