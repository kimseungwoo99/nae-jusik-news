import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import type { StockConfig } from "../src/types/news";

const configPath = path.resolve(process.cwd(), "config", "stocks.json");

function printHelp() {
  console.log(`새 관심 종목을 config/stocks.json에 추가합니다.

사용법:
  npm run stock:add -- --id lottechem --name 롯데케미칼 --ticker 011170 --keywords "롯데케미칼,롯데케미칼 실적"

필수 옵션:
  --id        영문 소문자, 숫자, 하이픈으로 만든 고유 ID
  --name      화면에 표시할 종목명
  --ticker    종목 코드
  --keywords  쉼표로 구분한 뉴스 검색어

예시:
  npm run stock:add -- --id lottechem --name 롯데케미칼 --ticker 011170 --keywords "롯데케미칼,롯데케미칼 실적"`);
}

function fail(message: string): never {
  console.error(`오류: ${message}`);
  console.error("자세한 사용법은 npm run stock:add -- --help 로 확인하세요.");
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    id: { type: "string" },
    name: { type: "string" },
    ticker: { type: "string" },
    keywords: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  printHelp();
  process.exit(0);
}

const id = values.id?.trim();
const name = values.name?.trim();
const ticker = values.ticker?.trim();
const keywords = [...new Set(
  (values.keywords ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean),
)];

if (!id || !name || !ticker || keywords.length === 0) {
  fail("--id, --name, --ticker, --keywords를 모두 입력해야 합니다.");
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  fail("--id는 영문 소문자 또는 숫자로 시작하고 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
}
if (!/^[0-9A-Za-z.-]{1,16}$/.test(ticker)) {
  fail("--ticker는 숫자·영문·점·하이픈을 사용해 1~16자로 입력하세요.");
}

let stocks: StockConfig[];
try {
  const parsed = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("배열 형식이 아닙니다.");
  stocks = parsed as StockConfig[];
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  fail(`config/stocks.json을 읽지 못했습니다. ${reason}`);
}

if (stocks.some((stock) => stock.id.toLowerCase() === id.toLowerCase())) {
  fail(`ID '${id}'가 이미 등록되어 있습니다.`);
}
if (stocks.some((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase())) {
  fail(`종목 코드 '${ticker}'가 이미 등록되어 있습니다.`);
}

const stock: StockConfig = {
  id,
  name,
  ticker,
  keywords,
  aliases: [name],
  defaultSelected: false,
};
stocks.push(stock);
await writeFile(configPath, `${JSON.stringify(stocks, null, 2)}\n`, "utf8");

console.log(`추가 완료: ${name} (${ticker})`);
console.log(`검색어: ${keywords.join(", ")}`);
console.log("변경 내용을 main 브랜치에 올리면 뉴스 수집과 사이트 배포가 이어집니다.");
