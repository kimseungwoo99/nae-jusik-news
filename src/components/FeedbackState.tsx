import { ArrowClockwise, NewspaperClipping } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="loading-list" role="status" aria-label="뉴스를 불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <span className="skeleton skeleton--short" />
          <span className="skeleton skeleton--title" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
        </div>
      ))}
      <span className="sr-only">뉴스를 불러오는 중입니다.</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="feedback-card" role="alert">
      <NewspaperClipping size={38} weight="regular" aria-hidden="true" />
      <h2>뉴스를 불러오지 못했습니다</h2>
      <p>{message}</p>
      <button type="button" className="primary-button" onClick={onRetry}>
        <ArrowClockwise size={22} weight="bold" aria-hidden="true" />
        다시 불러오기
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="feedback-card">
      <NewspaperClipping size={38} weight="regular" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
