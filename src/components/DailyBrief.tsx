import { Sparkle } from "@phosphor-icons/react";

interface DailyBriefProps {
  stockName: string;
  brief: string;
  points: string[];
}

export function DailyBrief({ stockName, brief, points }: DailyBriefProps) {
  return (
    <section className="daily-brief" aria-labelledby="daily-brief-title">
      <div className="daily-brief__title-row">
        <span className="daily-brief__icon" aria-hidden="true">
          <Sparkle size={22} weight="fill" />
        </span>
        <h2 id="daily-brief-title">오늘의 {stockName}</h2>
      </div>
      <p className="daily-brief__lead">{brief}</p>
      {points.length > 0 ? (
        <ul>
          {points.slice(0, 3).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
      <p className="daily-brief__note">뉴스 내용을 간추린 것으로, 투자 추천이 아닙니다.</p>
    </section>
  );
}
