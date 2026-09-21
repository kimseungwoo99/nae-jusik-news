const SEOUL_TIME_ZONE = "Asia/Seoul";

function getDateParts(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
}

function dateKey(value: string | Date) {
  const parts = getDateParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function isTodayInSeoul(value: string) {
  return dateKey(value) === dateKey(new Date());
}

export function formatUpdateTime(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  if (isTodayInSeoul(value)) {
    return `오늘 업데이트 ${time}`;
  }

  const day = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "long",
    day: "numeric",
  }).format(date);
  return `마지막 업데이트 ${day} ${time}`;
}

export function formatArticleTime(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  if (isTodayInSeoul(value)) {
    return time;
  }

  const day = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(date);
  return `${day} ${time}`;
}

export function isAfter(value: string, comparison: string | null) {
  if (!comparison) return false;
  return new Date(value).getTime() > new Date(comparison).getTime();
}
