import { test, expect } from "@playwright/test";
import { registerNewUser } from "./support/auth";
import { checkA11y } from "./support/axe";

/**
 * Complete the welcome/household-creation flow if needed, then return once on
 * /overview. Called after registerNewUser() which already waits for
 * /(overview|welcome).
 */
async function ensureHousehold(page: import("@playwright/test").Page): Promise<void> {
  if (!page.url().includes("/welcome")) return;
  await page.getByRole("button", { name: /get started/i }).click();
  await page.getByPlaceholder(/e\.g\. The Smiths/i).fill("Waterfall Household");
  await page.getByRole("button", { name: /create household/i }).click();
  await page.getByRole("button", { name: /go to overview/i }).click();
  await page.waitForURL(/\/overview/, { timeout: 10_000 });
}

test.describe("waterfall flow", () => {
  test("add income item, add committed item, overview loads with data", async ({ page }) => {
    await registerNewUser(page);
    await ensureHousehold(page);

    // ── Income ──────────────────────────────────────────────────────────────
    await page.goto("/income");
    await expect(page).toHaveURL(/\/income/);
    await checkA11y(page);

    // The right panel header contains the "+ Add" GhostAddButton
    await page.getByRole("button", { name: /^\+ add$/i }).click();

    // ItemForm opens — fill required fields
    await page.getByRole("textbox", { name: /name/i }).fill("Salary");
    await page.getByRole("textbox", { name: /amount/i }).fill("5000");
    // Frequency defaults to "monthly" — no change needed
    // Due date (first payment) defaults to today — no change needed

    // Save the item — the form has a Save button
    await page.getByRole("button", { name: /save/i }).click();

    // The new item should appear in the list
    await expect(page.getByText("Salary")).toBeVisible({ timeout: 5_000 });

    // ── Committed ───────────────────────────────────────────────────────────
    await page.goto("/committed");
    await expect(page).toHaveURL(/\/committed/);
    await checkA11y(page);

    await page.getByRole("button", { name: /^\+ add$/i }).click();

    await page.getByRole("textbox", { name: /name/i }).fill("Rent");
    await page.getByRole("textbox", { name: /amount/i }).fill("1200");

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Rent")).toBeVisible({ timeout: 5_000 });

    // ── Overview ─────────────────────────────────────────────────────────────
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/overview/);
    await checkA11y(page);

    // The overview page renders the waterfall left panel and a financial summary.
    // At minimum the overview page container should be visible.
    await expect(page.getByTestId("overview-page")).toBeVisible({ timeout: 10_000 });

    // The financial summary panel should load (not stay in loading state forever)
    await expect(page.getByTestId("financial-summary-panel")).toBeVisible({ timeout: 10_000 });
  });
});
