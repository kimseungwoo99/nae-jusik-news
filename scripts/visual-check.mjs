import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright-core";

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error("Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH를 지정해 주세요.");
}

const baseUrl = process.env.VISUAL_CHECK_URL || "http://127.0.0.1:4173";
const outputDirectory = path.join(process.cwd(), "visual-check");
const cases = [
  { name: "home-375", route: "/#/", width: 375, height: 812 },
  { name: "home-430", route: "/#/", width: 430, height: 932 },
  { name: "stock-375", route: "/#/stock/samsung", width: 375, height: 812 },
  { name: "all-news-375", route: "/#/all", width: 375, height: 812 },
  { name: "settings-375", route: "/#/settings", width: 375, height: 812 },
];

mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
let failed = false;

try {
  for (const testCase of cases) {
    const page = await browser.newPage({
      viewport: { width: testCase.width, height: testCase.height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      locale: "ko-KR",
    });

    await page.goto(`${baseUrl}${testCase.route}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDirectory, `${testCase.name}.png`),
      fullPage: false,
    });

    const result = await page.evaluate(() => {
      const bodyOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const interactiveElements = [...document.querySelectorAll("a, button, input, label")];
      const smallTargets = interactiveElements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const wrappingLabel = element instanceof HTMLInputElement ? element.closest("label") : null;
        const labelRect = wrappingLabel?.getBoundingClientRect();
        const hidden =
          rect.width === 0 ||
          rect.height === 0 ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          element.classList.contains("skip-link");
        if (hidden || element.closest(".sr-only")) return [];
        if (element instanceof HTMLLabelElement && !element.querySelector("input")) return [];
        if (labelRect && labelRect.width >= 44 && labelRect.height >= 44) return [];
        if (rect.width >= 44 && rect.height >= 44) return [];
        return [
          {
            tag: element.tagName.toLowerCase(),
            text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 40),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        ];
      });
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyOverflow,
        smallTargets,
      };
    });

    console.log(`${testCase.name}: ${JSON.stringify(result)}`);
    if (result.bodyOverflow || result.smallTargets.length > 0) failed = true;
    await page.close();
  }

  const smokePage = await browser.newPage({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
  });
  await smokePage.goto(`${baseUrl}/#/all`, { waitUntil: "networkidle" });
  await smokePage.locator(".news-card").first().getByRole("button", { name: "저장" }).click();
  assert.equal(
    await smokePage.evaluate(() =>
      JSON.parse(localStorage.getItem("stock-news-bookmarks") || "[]").length,
    ),
    1,
  );
  await smokePage.reload({ waitUntil: "networkidle" });
  await smokePage.locator(".news-card").first().getByRole("button", { name: "저장됨" }).waitFor();

  await smokePage.goto(`${baseUrl}/#/settings`, { waitUntil: "networkidle" });
  await smokePage.getByRole("radio", { name: /아주 크게/ }).check();
  assert.equal(
    await smokePage.evaluate(() => document.documentElement.dataset.fontSize),
    "xlarge",
  );
  await smokePage.getByText("현재 1개 기사").waitFor();

  await smokePage.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await smokePage.getByLabel("종목 뉴스 검색").fill("HBM");
  assert.ok((await smokePage.locator(".news-card").count()) >= 2);
  console.log("interaction-smoke: 저장/새로고침/글씨 크기/검색 동작 확인");
  await smokePage.close();
} finally {
  await browser.close();
}

if (failed) process.exitCode = 1;
