import { useCallback, useMemo } from "react";
import { stocks } from "../config";
import { useLocalStorage } from "./useLocalStorage";

const SELECTED_STOCKS_KEY = "stock-news-selected-stocks";
const DEFAULT_STOCK_IDS = stocks.map((stock) => stock.id);

export function useSelectedStocks() {
  const [storedStockIds, setStoredStockIds] = useLocalStorage<string[]>(
    SELECTED_STOCKS_KEY,
    DEFAULT_STOCK_IDS,
  );

  const supportedIds = useMemo(() => new Set(stocks.map((stock) => stock.id)), []);
  const selectedStockIds = useMemo(
    () => [
      ...new Set(
        (Array.isArray(storedStockIds) ? storedStockIds : []).filter(
          (stockId): stockId is string =>
            typeof stockId === "string" && supportedIds.has(stockId),
        ),
      ),
    ],
    [storedStockIds, supportedIds],
  );
  const selectedIdSet = useMemo(() => new Set(selectedStockIds), [selectedStockIds]);
  const selectedStocks = useMemo(
    () => stocks.filter((stock) => selectedIdSet.has(stock.id)),
    [selectedIdSet],
  );

  const isSelected = useCallback(
    (stockId: string) => selectedIdSet.has(stockId),
    [selectedIdSet],
  );

  const toggleStock = useCallback(
    (stockId: string) => {
      if (!supportedIds.has(stockId)) return;
      setStoredStockIds((current) => {
        const currentIds = Array.isArray(current)
          ? current.filter((id): id is string => typeof id === "string")
          : [];
        return currentIds.includes(stockId)
          ? currentIds.filter((id) => id !== stockId)
          : [...currentIds, stockId];
      });
    },
    [setStoredStockIds, supportedIds],
  );

  const selectAll = useCallback(
    () => setStoredStockIds(DEFAULT_STOCK_IDS),
    [setStoredStockIds],
  );

  return {
    selectedStockIds,
    selectedStocks,
    isSelected,
    toggleStock,
    selectAll,
  };
}
