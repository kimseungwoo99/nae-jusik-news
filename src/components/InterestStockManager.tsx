import { ChartLineUp, Check, Plus } from "@phosphor-icons/react";
import { stocks } from "../config";
import { useSelectedStocks } from "../hooks/useSelectedStocks";

export function InterestStockManager() {
  const { selectedStockIds, isSelected, toggleStock, selectAll } = useSelectedStocks();

  return (
    <section className="settings-section" aria-labelledby="interest-stocks-title">
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
        <strong>{selectedStockIds.length}개</strong> 종목을 보고 있습니다
        {selectedStockIds.length < stocks.length ? (
          <button type="button" onClick={selectAll}>
            모두 선택
          </button>
        ) : null}
      </div>

      <ul className="stock-manager__list" aria-label="등록 가능한 종목">
        {stocks.map((stock) => {
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

      <p className="stock-manager__note">
        목록에 없는 종목은 종목명과 종목코드를 알려주시면 지원 목록에 추가할 수 있습니다.
      </p>
    </section>
  );
}
