import { MagnifyingGlass } from "@phosphor-icons/react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function SearchField({
  value,
  onChange,
  label = "종목 뉴스 검색",
  placeholder = "종목명이나 뉴스 제목을 입력하세요",
}: SearchFieldProps) {
  return (
    <div className="search-field">
      <label htmlFor="news-search">{label}</label>
      <div className="search-field__control">
        <MagnifyingGlass size={24} weight="bold" aria-hidden="true" />
        <input
          id="news-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
        />
        {value ? (
          <button type="button" onClick={() => onChange("")}>
            지우기
          </button>
        ) : null}
      </div>
    </div>
  );
}
