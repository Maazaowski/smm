import { test } from "@playwright/test";
import path from "node:path";

/**
 * One-off capture of the live HotPlate site for the portfolio gallery.
 *
 * Not part of the normal suite — it hits a third-party origin, so it is skipped
 * unless CAPTURE_HOTPLATE=1. Read-only: it navigates and screenshots, and never
 * submits the quote form.
 *
 *   CAPTURE_HOTPLATE=1 npx playwright test e2e/capture-hotplate.spec.ts
 */
const ENABLED = process.env.CAPTURE_HOTPLATE === "1";

const OUT = path.join("public", "images", "projects", "hotplate");

const PAGES = [
  { slug: "home", url: "https://hotplatepk.com/", wait: "h1" },
  { slug: "packages", url: "https://hotplatepk.com/packages", wait: "h1" },
  { slug: "meal-plans", url: "https://hotplatepk.com/meal-plans", wait: "h1" },
  { slug: "quote", url: "https://hotplatepk.com/quote", wait: "form, h1" },
] as const;

test.describe("capture hotplate", () => {
  test.skip(!ENABLED, "set CAPTURE_HOTPLATE=1 to run");
  test.describe.configure({ mode: "serial" });

  for (const p of PAGES) {
    test(`capture ${p.slug}`, async ({ page }) => {
      test.setTimeout(120_000);

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(p.url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForSelector(p.wait, { timeout: 30_000 });

      // Scroll once so lazy images and any on-scroll animations resolve, then
      // return to the top for a clean above-the-fold capture.
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 150));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 500));
      });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(OUT, `site-${p.slug}.png`),
        // Viewport-sized, not fullPage: keeps every capture the same landscape
        // shape as the other projects' screenshots.
        fullPage: false,
      });
    });
  }
});
