import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NewsCollection } from "../types/news";
import { fetchAllNews } from "../utils/data";
import { isAfter } from "../utils/date";

const LAST_VISIT_KEY = "stock-news-last-visit";

interface NewsDataValue {
  data: NewsCollection | null;
  loading: boolean;
  error: string | null;
  previousVisit: string | null;
  isNewArticle: (collectedAt: string) => boolean;
  retry: () => void;
}

const NewsDataContext = createContext<NewsDataValue | null>(null);

export function NewsDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NewsCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [previousVisit] = useState<string | null>(() =>
    window.localStorage.getItem(LAST_VISIT_KEY),
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchAllNews(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        window.localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "뉴스 데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);
  const isNewArticle = useCallback(
    (collectedAt: string) => isAfter(collectedAt, previousVisit),
    [previousVisit],
  );

  const value = useMemo(
    () => ({ data, loading, error, previousVisit, isNewArticle, retry }),
    [data, error, isNewArticle, loading, previousVisit, retry],
  );

  return (
    <NewsDataContext.Provider value={value}>
      {children}
    </NewsDataContext.Provider>
  );
}

export function useNewsData() {
  const value = useContext(NewsDataContext);
  if (!value) throw new Error("useNewsData must be used inside NewsDataProvider");
  return value;
}
