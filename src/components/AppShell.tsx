import {
  Gear,
  House,
  NewspaperClipping,
} from "@phosphor-icons/react";
import { Link, Outlet, useLocation } from "react-router-dom";

const navigation = [
  { to: "/", label: "홈", icon: House },
  { to: "/all", label: "전체 뉴스", icon: NewspaperClipping },
  { to: "/settings", label: "설정", icon: Gear },
];

export function AppShell() {
  const location = useLocation();

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="주요 메뉴">
        {navigation.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/stock/")
              : item.to === "/settings"
                ? location.pathname === "/settings" || location.pathname === "/saved"
                : location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`bottom-nav__item${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={25} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
