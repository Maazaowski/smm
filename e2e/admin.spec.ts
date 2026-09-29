import { test, expect, type Page } from "@playwright/test";

/**
 * The desk. Everything here runs unauthenticated unless ADMIN_PASSWORD is in
 * the environment, in which case the signed-in sections are exercised too.
 */

const PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Signs in through the page's own request context, so the session cookie
 * lands in the browser context the page navigates with. The standalone
 * `request` fixture has its own cookie jar and would leave the page signed out.
 */
async function signIn(page: Page) {
  const res = await page.request.post("/api/auth", { data: { password: PASSWORD } });
  expect(res.status(), "sign-in").toBe(200);
}

test.describe("desk, signed out", () => {
  test("/admin shows the login and nothing else", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    // No section chrome leaks past the password box.
    await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(0);
  });

  test("/dashboard is the analytics section now", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/admin\?tab=analytics$/);
  });

  test("admin APIs refuse without a session", async ({ request }) => {
    for (const path of ["/api/admin/analytics", "/api/admin/posts"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test("a wrong password is told apart from a missing one", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Password").fill("definitely-not-it");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Scoped to the form's own error line: the Next dev overlay also mounts
    // a role="alert" element, which a bare getByRole would pick up.
    await expect(page.locator("#ad-password-err")).toContainText(/not the password|too many/i);
  });
});

test.describe("desk, signed in", () => {
  test.skip(!PASSWORD, "ADMIN_PASSWORD not set");

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("every section renders under its slug line", async ({ page }) => {
    const sections: [string, RegExp][] = [
      ["/admin", /\/\/ Essays/],
      ["/admin?tab=projects", /\/\/ Work/],
      ["/admin?tab=about", /\/\/ About/],
      ["/admin?tab=testimonials", /\/\/ References/],
      ["/admin?tab=analytics", /\/\/ Analytics/],
    ];
    for (const [url, slug] of sections) {
      await page.goto(url);
      await expect(page.locator(".sg-slug-label")).toHaveText(slug);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("the essays list shows a view count per row", async ({ page }) => {
    await page.goto("/admin");
    const rows = page.locator(".ad-row");
    await expect(rows.first()).toBeVisible();
    await expect(rows.first().locator(".ad-fig-v")).not.toHaveText("–");
  });

  test("analytics returns one shape whether or not Redis is configured", async ({
    page,
  }) => {
    const res = await page.request.get("/api/admin/analytics");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.dailyViews).toHaveLength(30);
    expect(typeof data.tracking).toBe("boolean");
    expect(data.postStats.length).toBe(data.totalPosts);
    for (const s of data.postStats) {
      expect(Object.keys(s.reactions).sort()).toEqual(["fire", "heart", "idea", "mindblown"]);
    }
  });

  test("delete asks before it acts, inline", async ({ page }) => {
    await page.goto("/admin");
    await page.locator(".ad-row").first().getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(/Delete/);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe("essay page", () => {
  test("records a view and offers reactions", async ({ page }) => {
    await page.goto("/blog");
    const first = page.locator("a.sg-essay").first();
    await expect(first).toBeVisible();
    await first.click();

    // The view count is the beacon's response, so it proves the POST ran.
    await expect(page.locator(".sg-read-meta")).toContainText(/\d+ views?/);
    await expect(page.getByRole("group", { name: "React to this essay" })).toBeVisible();
    await expect(
      page.getByRole("group", { name: "React to this essay" }).getByRole("button")
    ).toHaveCount(4);
  });
});
