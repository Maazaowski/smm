import { test, expect, type Page } from "@playwright/test";

const SLUGS = ["khataflow", "stencil", "signal", "hotplate", "raqam"] as const;

const SHOTS = "e2e/screenshots";

/**
 * next-themes stores the choice in localStorage and puts a class on <html>.
 * Setting it before any script runs avoids a flash of the wrong theme in the
 * screenshot.
 */
async function useTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((t) => {
    window.localStorage.setItem("theme", t);
  }, theme);
}

/**
 * Cards and sections animate in with framer-motion `whileInView`, starting at
 * opacity 0. A full-page screenshot never scrolls, so everything below the fold
 * would be captured invisible. Scroll the whole page once to trigger them
 * (viewport is `once: true`, so they stay visible), then return to the top.
 */
async function revealAll(page: Page) {
  const width = page.viewportSize()?.width ?? 1280;

  // Grow the viewport until the whole document fits inside it. Scrolling is not
  // enough here — framer-motion's IntersectionObserver does not reliably fire
  // for every card during a scripted scroll, and `once: true` means a card that
  // was missed stays at opacity 0 forever.
  const height = await page.evaluate(() =>
    Math.min(
      document.documentElement.scrollHeight + 200,
      // Chromium refuses viewports beyond ~16k.
      15000
    )
  );
  await page.setViewportSize({ width, height });

  // Springs need a moment to settle once every card is in view.
  await page.waitForTimeout(1200);
}

/** The page must never scroll sideways, at any width. */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(1);
}

test.describe("projects index", () => {
  test("lists every project and links through", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");

    for (const slug of SLUGS) {
      await expect(
        page.locator(`a[href="/projects/${slug}"]`).first()
      ).toBeVisible();
    }

    await expectNoHorizontalOverflow(page);
    await revealAll(page);
    await page.screenshot({ path: `${SHOTS}/index-dark.png`, fullPage: true });
  });

  test("renders in light theme", async ({ page }) => {
    await useTheme(page, "light");
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await revealAll(page);
    await page.screenshot({ path: `${SHOTS}/index-light.png`, fullPage: true });
  });

  test("renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await revealAll(page);
    await page.screenshot({ path: `${SHOTS}/index-mobile.png`, fullPage: true });
  });

  test("card title navigates to the detail page", async ({ page }) => {
    await page.goto("/projects");
    await page.locator('a[href="/projects/signal"]').first().click();
    await expect(page).toHaveURL(/\/projects\/signal$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signal");
  });
});

test.describe("project detail pages", () => {
  for (const slug of SLUGS) {
    test(`${slug} renders`, async ({ page }) => {
      await page.goto(`/projects/${slug}`);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // The MDX case study body.
      await expect(page.locator(".prose")).toBeVisible();
      // At least a couple of sections, which is what feeds the TOC.
      expect(
        await page.locator(".prose h2").count(),
        "case study has section headings"
      ).toBeGreaterThan(1);

      await expectNoHorizontalOverflow(page);
      await revealAll(page);
      await page.screenshot({
        path: `${SHOTS}/detail-${slug}.png`,
        fullPage: true,
      });
    });
  }

  test("screenshots render and every image actually loads", async ({ page }) => {
    test.setTimeout(120_000);
    const expected: Record<string, number> = {
      khataflow: 4,
      stencil: 4,
      signal: 4,
      raqam: 4,
      hotplate: 6,
    };

    for (const [slug, count] of Object.entries(expected)) {
      await page.goto(`/projects/${slug}`);

      const figures = page.locator("section", { hasText: "Screenshots" }).locator("figure");
      await expect(figures, `${slug} gallery size`).toHaveCount(count);

      // Don't rely on lazy-loading to prove the images are real: a tall page
      // can leave the last ones below the viewport forever. Resolve each
      // src instead — that tests the path, the file and the optimizer.
      const srcs = await page
        .locator("figure img")
        .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));

      expect(srcs.length, `${slug} image count`).toBe(count);

      for (const src of srcs) {
        const res = await page.request.get(src);
        expect(res.status(), `${slug} image ${src}`).toBe(200);
        expect(
          Number(res.headers()["content-length"] ?? 1),
          `${slug} image is empty: ${src}`
        ).toBeGreaterThan(0);
      }

      // Every screenshot needs real alt text for the lightbox label and a11y.
      const alts = await page
        .locator("figure img")
        .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).alt));
      expect(alts.every((a) => a.length > 20), `${slug} alt text`).toBe(true);
    }
  });

  test("lightbox opens on click and closes on Escape", async ({ page }) => {
    await page.goto("/projects/khataflow");
    await page.locator("figure button").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  /**
   * The case studies are deliberately a product overview, not a blueprint.
   * This fails if implementation detail creeps back into a public page.
   */
  test("no architecture or security detail is published", async ({ page }) => {
    const BANNED = [
      "RLS",
      "row-level security",
      "HMAC",
      "BIGINT",
      "INT4",
      "current_org_id",
      "identity envelope",
      "signed-request",
      "INTERNAL_AUTH_SECRET",
      "interpreter.py",
      "region anchors",
      "row classifiers",
    ];

    for (const slug of SLUGS) {
      await page.goto(`/projects/${slug}`);
      // .first() — the case study; the "Other projects" cards are <article> too.
      const text = (
        await page.locator("article").first().innerText()
      ).toLowerCase();
      const found = BANNED.filter((t) => text.includes(t.toLowerCase()));
      expect(found, `${slug} leaks implementation detail`).toEqual([]);
    }
  });

  test("private repos never expose a repo link", async ({ page }) => {
    // KhataFlow and HotPlatePk are private. Until a sync runs there are no
    // stats at all; once one does, repoUrl must stay null for these two.
    //
    // Scoped to <article> and to *repo* URLs specifically: the site footer
    // links to the owner's GitHub profile on every page, which is fine.
    const REPO_LINK = 'a[href*="github.com/"][href*="/KhataFlow"], ' +
      'a[href*="github.com/"][href*="/HotPlatePk"]';

    for (const slug of ["khataflow", "hotplate"]) {
      await page.goto(`/projects/${slug}`);
      await expect(
        page.locator("article").first().locator(REPO_LINK),
        `${slug} must not link to its private repo`
      ).toHaveCount(0);
      // Nothing in the article should point at github.com at all today.
      await expect(
        page.locator("article").first().locator('a[href*="github.com"]'),
        `${slug} article must not link to GitHub`
      ).toHaveCount(0);
    }
  });

  test("public repos may link to their repo once synced", async ({ page }) => {
    // Signal and Stencil are public. With no stats row yet there is no link;
    // this asserts the fail-closed default rather than the post-sync state.
    await page.goto("/projects/signal");
    const links = page.locator("article").first().locator('a[href*="github.com"]');
    expect(await links.count()).toBeLessThanOrEqual(1);
  });

  test("wide content scrolls inside its own container", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects/stencil");
    await expectNoHorizontalOverflow(page);
    await revealAll(page);
    await page.screenshot({
      path: `${SHOTS}/detail-stencil-mobile.png`,
      fullPage: true,
    });
  });
});
