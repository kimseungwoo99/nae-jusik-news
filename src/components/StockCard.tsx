import { CaretRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { StockConfig } from "../types/news";

interface StockCardProps {
  stock: StockConfig;
  articleCount: number;
  todayCount: number;
  newCount: number;
}

export function StockCard({
  stock,
  articleCount,
  todayCount,
  newCount,
}: StockCardProps) {
  const countText =
    todayCount > 0 ? `오늘 뉴스 ${todayCount}개` : `최근 뉴스 ${articleCount}개`;

  return (
    <Link
      to={`/stock/${stock.id}`}
      className="stock-card"
      aria-label={`${stock.name} ${stock.ticker}, ${countText}${newCount ? `, 새 뉴스 ${newCount}개` : ""}`}
    >
      <span className="stock-card__mark" aria-hidden="true">
        {stock.name.slice(0, 1)}
      </span>
      <span className="stock-card__body">
        <strong>{stock.name}</strong>
        <span className="stock-card__ticker">종목코드 {stock.ticker}</span>
        <span className="stock-card__count">{countText}</span>
      </span>
      <span className="stock-card__end">
        {newCount > 0 ? <span className="new-count">새 뉴스 {newCount}개</span> : null}
        <CaretRight size={25} weight="bold" aria-hidden="true" />
      </span>
    </Link>
  );
}
