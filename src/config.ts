import stocksJson from "../config/stocks.json";
import type { StockConfig } from "./types/news";

export const stocks = stocksJson as StockConfig[];

export function findStock(stockId: string | undefined) {
  return stocks.find((stock) => stock.id === stockId);
}
