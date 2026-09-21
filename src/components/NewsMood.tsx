import { ChartBar, Minus, TrendDown, TrendUp } from "@phosphor-icons/react";
import type { StockMood } from "../utils/newsAnalysis";

export function NewsMood({ stockName, mood }: { stockName: string; mood: StockMood }) {
  const counts = [
    { key: "positive", label: "긍정 표현", count: mood.positive, Icon: TrendUp },
    { key: "neutral", label: "중립 표현", count: mood.neutral, Icon: Minus },
    { key: "negative", label: "부정 표현", count: mood.negative, Icon: TrendDown },
  ] as const;

  return (
    <section className={`analysis-card mood-card mood-card--${mood.label}`} aria-labelledby="news-mood-title">
      <div className="analysis-card__heading">
        <span className="analysis-card__icon" aria-hidden="true">
          <ChartBar size={24} weight="fill" />
        </span>
        <div>
          <p className="analysis-card__kicker">최근 {mood.total}개 기사 기준</p>
          <h2 id="news-mood-title">{stockName} 뉴스 분위기</h2>
        </div>
      </div>

      <p className="mood-card__lead">{mood.headline}</p>

      <div className="mood-counts" role="list" aria-label="뉴스 표현 분석 결과">
        {counts.map(({ key, label, count, Icon }) => (
          <div className={`mood-count mood-count--${key}`} role="listitem" key={key}>
            <Icon size={22} weight="bold" aria-hidden="true" />
            <span>{label}</span>
            <strong>{count}건</strong>
          </div>
        ))}
      </div>

      {mood.total > 0 ? (
        <div className="mood-meter" aria-hidden="true">
          {counts.map(({ key, count }) => (
            <span
              className={`mood-meter__${key}`}
              style={{ width: `${(count / mood.total) * 100}%` }}
              key={key}
            />
          ))}
        </div>
      ) : null}

      {mood.evidence.length > 0 ? (
        <p className="mood-card__evidence">
          <strong>판정에 반영된 표현</strong>
          <span>{mood.evidence.join(" · ")}</span>
        </p>
      ) : null}

      <p className="analysis-card__note">
        기사 제목과 요약의 표현을 자동 분석한 참고 정보입니다. 주가 전망이나 투자 추천이 아닙니다.
      </p>
    </section>
  );
}
