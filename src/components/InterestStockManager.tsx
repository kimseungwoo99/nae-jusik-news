import { ChartLineUp, Check, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { stocks } from "../config";
import { useSelectedStocks } from "../hooks/useSelectedStocks";
import { SearchField } from "./SearchField";

export function InterestStockManager() {
  const [query, setQuery] = useState("");
  const { selectedStockIds, isSelected, toggleStock, selectAll } = useSelectedStocks();
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const visibleStocks = useMemo(
    () =>
      stocks.filter((stock) =>
        `${stock.name} ${stock.ticker} ${stock.aliases?.join(" ") ?? ""}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  return (
    <section className="settings-section stock-manager" aria-labelledby="interest-stocks-title">
      <div className="settings-section__heading">
        <span className="settings-icon" aria-hidden="true">
          <ChartLineUp size={25} weight="bold" />
        </span>
        <div>
          <h2 id="interest-stocks-title">관심 종목 관리</h2>
          <p>버튼을 누르면 홈에서 종목을 추가하거나 뺄 수 있습니다.</p>
        </div>
      </div>

      <div className="stock-manager__summary" aria-live="polite" aria-atomic="true">
        <strong>{selectedStockIds.length}개 선택</strong>
        <span>· 전체 {stocks.length}개</span>
        {selectedStockIds.length < stocks.length ? (
          <button type="button" onClick={selectAll}>
            모두 선택
          </button>
        ) : null}
      </div>

      <SearchField
        value={query}
        onChange={setQuery}
        label="추가할 종목 찾기"
        placeholder="종목명 또는 종목코드"
      />

      <ul className="stock-manager__list" aria-label="등록 가능한 종목">
        {visibleStocks.map((stock) => {
          const selected = isSelected(stock.id);
          return (
            <li key={stock.id}>
              <button
                type="button"
                className={`stock-manager__item${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                aria-label={`${stock.name} ${stock.ticker}, 관심 종목에서 ${selected ? "제거" : "추가"}`}
                onClick={() => toggleStock(stock.id)}
              >
                <span className="stock-manager__mark" aria-hidden="true">
                  {stock.name.slice(0, 1)}
                </span>
                <span className="stock-manager__name">
                  <strong>{stock.name}</strong>
                  <small>종목코드 {stock.ticker}</small>
                </span>
                <span className="stock-manager__status">
                  {selected ? (
                    <Check size={21} weight="bold" aria-hidden="true" />
                  ) : (
                    <Plus size={21} weight="bold" aria-hidden="true" />
                  )}
                  {selected ? "선택됨" : "추가"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {visibleStocks.length === 0 ? (
        <p className="stock-manager__empty" role="status">
          일치하는 종목이 없습니다.
        </p>
      ) : null}

      <p className="stock-manager__note">
        목록에 없는 종목은 종목명과 종목코드를 알려주시면 지원 목록에 추가할 수 있습니다.
      </p>
    </section>
  );
}
