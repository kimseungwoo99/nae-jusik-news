import {
  BookmarkSimple,
  CaretRight,
  DownloadSimple,
  ShieldCheck,
  TextAa,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InterestStockManager } from "../components/InterestStockManager";
import { PageHeader } from "../components/PageHeader";
import { useNewsData } from "../context/NewsDataContext";
import { useBookmarks } from "../hooks/useBookmarks";
import { useFontSize } from "../hooks/useFontSize";
import type { FontSizePreference } from "../types/news";
import { formatUpdateTime } from "../utils/date";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const fontOptions: Array<{
  value: FontSizePreference;
  label: string;
  example: string;
}> = [
  { value: "default", label: "기본", example: "편안한 큰 글씨" },
  { value: "large", label: "크게", example: "더 편안한 큰 글씨" },
  { value: "xlarge", label: "아주 크게", example: "가장 큰 글씨" },
];

export function SettingsPage() {
  const { fontSize, setFontSize } = useFontSize();
  const { bookmarks } = useBookmarks();
  const { data } = useNewsData();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallMessage("홈 화면에 설치했습니다.");
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallMessage("설치를 시작했습니다.");
    }
    setInstallPrompt(null);
  };

  return (
    <div className="page settings-page">
      <PageHeader
        title="설정"
        description="볼 종목을 고르고 읽기 편한 크기로 맞추세요."
      />

      <InterestStockManager />

      <section className="settings-section" aria-labelledby="font-size-title">
        <div className="settings-section__heading">
          <span className="settings-icon" aria-hidden="true">
            <TextAa size={25} weight="bold" />
          </span>
          <div>
            <h2 id="font-size-title">글씨 크기</h2>
            <p>선택하면 바로 모든 화면에 적용됩니다.</p>
          </div>
        </div>

        <fieldset className="font-options">
          <legend className="sr-only">글씨 크기 선택</legend>
          {fontOptions.map((option) => (
            <label
              key={option.value}
              className={fontSize === option.value ? "is-selected" : ""}
            >
              <input
                type="radio"
                name="font-size"
                value={option.value}
                checked={fontSize === option.value}
                onChange={() => setFontSize(option.value)}
              />
              <span>
                <strong>{option.label}</strong>
                <small className={`font-example font-example--${option.value}`}>
                  {option.example}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="settings-section" aria-labelledby="saved-news-title">
        <div className="settings-section__heading">
          <span className="settings-icon" aria-hidden="true">
            <BookmarkSimple size={25} weight="bold" />
          </span>
          <div>
            <h2 id="saved-news-title">저장한 뉴스</h2>
            <p>이 기기에만 안전하게 보관됩니다.</p>
          </div>
        </div>
        <Link className="settings-link" to="/saved">
          <span>
            <strong>저장 목록 열기</strong>
            <small>현재 {bookmarks.length}개 기사</small>
          </span>
          <CaretRight size={24} weight="bold" aria-hidden="true" />
        </Link>
      </section>

      <section className="settings-section" aria-labelledby="install-title">
        <div className="settings-section__heading">
          <span className="settings-icon" aria-hidden="true">
            <DownloadSimple size={25} weight="bold" />
          </span>
          <div>
            <h2 id="install-title">홈 화면에 추가</h2>
            <p>앱처럼 아이콘을 눌러 바로 열 수 있습니다.</p>
          </div>
        </div>

        {installPrompt ? (
          <button type="button" className="primary-button wide-button" onClick={installApp}>
            <DownloadSimple size={23} weight="bold" aria-hidden="true" />
            이 기기에 설치하기
          </button>
        ) : (
          <div className="install-guide">
            <p><strong>Android</strong> 브라우저 메뉴에서 ‘앱 설치’를 선택하세요.</p>
            <p><strong>iPhone</strong> 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.</p>
          </div>
        )}
        <p className="sr-status" aria-live="polite">{installMessage}</p>
      </section>

      <section className="privacy-card" aria-labelledby="privacy-title">
        <ShieldCheck size={28} weight="fill" aria-hidden="true" />
        <div>
          <h2 id="privacy-title">로그인 없이 사용합니다</h2>
          <p>관심 종목, 글씨 크기, 새 뉴스 확인 시각, 저장한 기사는 현재 기기의 브라우저에만 남습니다.</p>
          {data ? <small>{formatUpdateTime(data.generatedAt)}</small> : null}
        </div>
      </section>
    </div>
  );
}
