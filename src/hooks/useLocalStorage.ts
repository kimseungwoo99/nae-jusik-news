import { useCallback, useEffect, useState } from "react";

const LOCAL_EVENT = "stock-news-local-storage";

function readValue<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValueState] = useState<T>(() => readValue(key, fallback));

  useEffect(() => {
    const syncValue = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (!customEvent.detail?.key || customEvent.detail.key === key) {
        setValueState(readValue(key, fallback));
      }
    };

    const syncStorage = (event: StorageEvent) => {
      if (event.key === key) setValueState(readValue(key, fallback));
    };

    window.addEventListener(LOCAL_EVENT, syncValue);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(LOCAL_EVENT, syncValue);
      window.removeEventListener("storage", syncStorage);
    };
  }, [fallback, key]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = readValue(key, fallback);
      const resolved =
        typeof next === "function"
          ? (next as (currentValue: T) => T)(current)
          : next;

      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Keep the UI usable even when storage is blocked or full.
      }
      setValueState(resolved);
      window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key } }));
    },
    [fallback, key],
  );

  return [value, setValue] as const;
}
