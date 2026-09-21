import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = "뒤로",
}: PageHeaderProps) {
  return (
    <header className="page-header">
      {backTo ? (
        <Link className="back-link" to={backTo}>
          <ArrowLeft size={24} weight="bold" aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      ) : null}
      <h1 tabIndex={-1}>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  );
}
