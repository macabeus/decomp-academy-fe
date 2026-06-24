// Capture screenshots of key UI states for design review.
//   node scripts/shots.mjs [baseURL] [outDir]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3939";
const OUT = process.argv[3] || path.resolve("scratch/shots");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, url, { width = 1440, height = 900, prep } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  if (prep) await prep(page);
  await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: false });
  await page.close();
  console.log("shot", name);
}

// 1. Landing / hero + curriculum map (desktop)
await shot("01-home-desktop", "/");
// 2. Home full page (tall) to see curriculum
await shot("02-home-curriculum", "/", {
  height: 1400,
  prep: async (p) => {
    await p.evaluate(() => window.scrollTo(0, 520));
    await p.waitForTimeout(300);
  },
});
// 3. A coding lesson workspace (editor + target asm)
await shot("03-lesson-workspace", "/lesson/foundations-add", {
  prep: async (p) => p.waitForTimeout(1200),
});
// 4. A concept (reading) lesson
await shot("04-concept-lesson", "/lesson/workflow-what-matching-means", {
  prep: async (p) => p.waitForTimeout(500),
});
// 5. A successful 100% match — load the solution and check
await shot("05-match-success", "/lesson/foundations-add", {
  prep: async (p) => {
    await p.waitForTimeout(1200);
    // Reveal + load the reference solution into the editor, then check.
    const showBtn = p.getByText("Show reference solution", { exact: false });
    if (await showBtn.count()) {
      await showBtn.first().click();
      const loadBtn = p.getByText("Load into editor", { exact: false });
      await loadBtn.first().click();
    }
    await p.getByRole("button", { name: /Compile/i }).click();
    await p.waitForTimeout(2500);
  },
});
// 6. A mid-difficulty lesson with the diff tab after a wrong-ish answer
await shot("06-lesson-diff", "/lesson/loops-array-sum", {
  prep: async (p) => p.waitForTimeout(1200),
});
// 7. Mobile home
await shot("07-home-mobile", "/", { width: 390, height: 844 });
// 7b. Mobile lesson workspace (must stack and scroll, not cram)
await shot("07b-lesson-mobile", "/lesson/foundations-add", {
  width: 390,
  height: 844,
  prep: async (p) => p.waitForTimeout(1200),
});
// 7c. A lesson whose brief has a blockquote (verify it renders styled)
await shot("07c-blockquote", "/lesson/loops-array-sum", {
  prep: async (p) => {
    await p.waitForTimeout(800);
    await p.evaluate(() => {
      const el = document.querySelector(".prose-lesson blockquote");
      if (el) el.scrollIntoView({ block: "center" });
    });
    await p.waitForTimeout(300);
  },
});
// 8. A hard mastery lesson (long target asm)
await shot("08-mastery", "/lesson/mastery-mine-reset", {
  prep: async (p) => p.waitForTimeout(1400),
});

await browser.close();
console.log("done ->", OUT);
