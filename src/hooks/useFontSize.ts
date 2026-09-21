import { useEffect } from "react";
import type { FontSizePreference } from "../types/news";
import { useLocalStorage } from "./useLocalStorage";

const FONT_SIZE_KEY = "stock-news-font-size";

export function useFontSize() {
  const [fontSize, setFontSize] = useLocalStorage<FontSizePreference>(
    FONT_SIZE_KEY,
    "default",
  );

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  return { fontSize, setFontSize };
}
