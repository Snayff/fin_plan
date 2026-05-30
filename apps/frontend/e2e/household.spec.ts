import { test, expect } from "@playwright/test";
import { registerNewUser } from "./support/auth";
import { uniqueEmail } from "./support/api";
import { checkA11y } from "./support/axe";

const API_BASE = process.env.E2E_API_URL ?? "http://localhost:3001";

/**
 * Fetch the CSRF token from the backend. The frontend's ApiClient uses
 * GET /api/auth/csrf-token → { csrfToken: string }.
 */
async function getCsrfToken(page: import("@playwright/test").Page): Promise<string> {
  const res = await page.request.get(`${API_BASE}/api/auth/csrf-token`);
  if (res.ok()) {
    const data = (await res.json()) as { csrfToken?: string };
    return data.csrfToken ?? "";
  }
  return "";
}

test.describe("household flow", () => {
  test("new user is redirected to /welcome to create a household", async ({ page }) => {
    await registerNewUser(page);
    // A brand-new user has no household — they land on /welcome
    await expect(page).toHaveURL(/\/(welcome|overview)/);
    await checkA11y(page);
  });

  test("create household via welcome flow and land on overview", async ({ page }) => {
    await registerNewUser(page);

    // If already on overview (backend auto-creates household), this is fine.
    // Otherwise complete the welcome flow.
    const currentUrl = page.url();
    if (currentUrl.includes("/welcome")) {
      await checkA11y(page);

      // Phase 1: hero card — click "Get started"
      await page.getByRole("button", { name: /get started/i }).click();

      // Phase 2: name input
      const householdNameInput = page.getByPlaceholder(/e\.g\. The Smiths/i);
      await householdNameInput.fill("E2E Test Household");
      await page.getByRole("button", { name: /create household/i }).click();

      // Phase 3: celebrate → click "Go to overview"
      await page.getByRole("button", { name: /go to overview/i }).click();
    }

    await expect(page).toHaveURL(/\/overview/, { timeout: 10_000 });
    await checkA11y(page);
    await expect(page.getByTestId("overview-page")).toBeVisible();
  });

  test("invite and join via link (new user signup path)", async ({ page, browser }) => {
    // Owner: register and complete household creation if needed
    await registerNewUser(page);

    // Ensure owner is on an authed page with an active household
    await page.waitForURL(/\/(overview|welcome)/, { timeout: 10_000 });
    if (page.url().includes("/welcome")) {
      await page.getByRole("button", { name: /get started/i }).click();
      await page.getByPlaceholder(/e\.g\. The Smiths/i).fill("Owner Household");
      await page.getByRole("button", { name: /create household/i }).click();
      await page.getByRole("button", { name: /go to overview/i }).click();
      await page.waitForURL(/\/overview/, { timeout: 10_000 });
    }

    // Get the active household ID from the auth/me endpoint (cookies shared with page.request)
    const meRes = await page.request.get(`${API_BASE}/api/auth/me`);
    if (!meRes.ok()) {
      throw new Error(`GET /api/auth/me failed: ${meRes.status()}`);
    }
    const meData = (await meRes.json()) as {
      activeHouseholdId?: string;
      householdId?: string;
    };
    const householdId = meData.activeHouseholdId ?? meData.householdId;
    if (!householdId) {
      throw new Error("Could not determine householdId from /api/auth/me response");
    }

    const csrfToken = await getCsrfToken(page);
    const inviteEmail = uniqueEmail("invitee");

    // Create the invite via the API — POST /api/households/:id/invite
    const inviteRes = await page.request.post(`${API_BASE}/api/households/${householdId}/invite`, {
      data: { email: inviteEmail },
      headers: {
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
    });

    if (!inviteRes.ok()) {
      throw new Error(
        `POST /api/households/${householdId}/invite failed: ${inviteRes.status()} — ${await inviteRes.text()}`
      );
    }

    const inviteBody = (await inviteRes.json()) as { token: string; invitedEmail: string };
    const inviteToken = inviteBody.token;

    // Invitee opens the accept-invite link in a fresh browser context (no owner cookies)
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();

    await inviteePage.goto(`/accept-invite/${inviteToken}`);
    await inviteePage.waitForLoadState("networkidle");
    await checkA11y(inviteePage);

    // AcceptInvitePage shows "You're Invited" heading and a form for new users
    await expect(inviteePage.getByRole("heading", { name: /you're invited/i })).toBeVisible({
      timeout: 10_000,
    });

    // Fill in new-user signup form (mode "new" is default)
    await inviteePage.locator("#name").fill("Invited User");
    await inviteePage.locator("#email").fill(inviteEmail);
    await inviteePage.locator("#password").fill("BrowserTest123!");
    await inviteePage.locator("#confirmPassword").fill("BrowserTest123!");
    await inviteePage.getByRole("button", { name: /create account & join/i }).click();

    // Should redirect to /overview after joining
    await inviteePage.waitForURL(/\/(overview|welcome)/, { timeout: 15_000 });
    await checkA11y(inviteePage);

    await inviteeContext.close();
  });

  test("navigate to household settings page", async ({ page }) => {
    await registerNewUser(page);
    await page.waitForURL(/\/(overview|welcome)/, { timeout: 10_000 });

    if (page.url().includes("/welcome")) {
      await page.getByRole("button", { name: /get started/i }).click();
      await page.getByPlaceholder(/e\.g\. The Smiths/i).fill("Settings Household");
      await page.getByRole("button", { name: /create household/i }).click();
      await page.getByRole("button", { name: /go to overview/i }).click();
      await page.waitForURL(/\/overview/, { timeout: 10_000 });
    }

    await page.goto("/settings/household");
    await expect(page).toHaveURL(/\/settings\/household/);
    await checkA11y(page);
    // The left panel title should contain "Household"
    await expect(page.getByText("Members & invites")).toBeVisible();
  });
});
