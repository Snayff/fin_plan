import type { Page } from "@playwright/test";
import { uniqueEmail } from "./api";

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export async function registerNewUser(
  page: Page,
  overrides: Partial<TestUser> = {}
): Promise<TestUser> {
  const user: TestUser = {
    email: overrides.email ?? uniqueEmail("reg"),
    password: overrides.password ?? "BrowserTest123!",
    name: overrides.name ?? "E2E User",
  };
  await page.goto("/register");
  // RegisterPage uses htmlFor="name", htmlFor="email", htmlFor="password"
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  // confirmPassword field is also required
  await page.locator("#confirmPassword").fill(user.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/(overview|onboarding|welcome)/, { timeout: 10_000 });
  return user;
}

export async function login(page: Page, user: Pick<TestUser, "email" | "password">) {
  await page.goto("/login");
  // LoginPage uses htmlFor="email" and htmlFor="password"
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(overview|onboarding|welcome)/, { timeout: 10_000 });
}

export async function logout(page: Page) {
  // ProfileAvatar has aria-label="Profile menu" button — click it to open the dropdown
  await page.getByRole("button", { name: /profile menu/i }).click();
  // The dropdown contains a menuitem "Sign out"
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await page.waitForURL(/\/login/, { timeout: 5_000 });
}
