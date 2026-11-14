import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("a new developer can register and open a shared coding workspace", async ({ page }) => {
  const suffix = randomUUID().slice(0, 10);
  const email = "browser-" + suffix + "@example.test";
  const username = "browser-" + suffix;
  const sessionName = "e2e-" + suffix;
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("E2e-" + randomUUID() + "-Aa9!");

  const registrationResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/register"),
    { timeout: 15000 }
  );
  await page.getByRole("button", { name: "Create account" }).click();

  const registrationResponse = await registrationResponsePromise;
  const registrationBody = await registrationResponse.json().catch(() => null);
  expect(
    registrationResponse.ok(),
    "registration endpoint returned " +
      registrationResponse.status() +
      ": " +
      JSON.stringify(registrationBody)
  ).toBeTruthy();

  await expect(page).toHaveURL(/\/sessions$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Make room for/ })).toBeVisible();
  await page.screenshot({ path: "test-results/sessions-overview.png", fullPage: true });

  await page.getByLabel("SESSION NAME").fill(sessionName);
  await page.getByRole("button", { name: "Open workspace" }).click();

  await expect(page).toHaveURL(new RegExp("/workspace/" + sessionName + "$"), { timeout: 15000 });
  await expect(page.getByText(sessionName, { exact: true }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "Members" })).toBeVisible();
  await expect(page.getByText(/OWNER ACCESS/)).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "test-results/workspace-owner.png", fullPage: true });

  expect(pageErrors, "browser runtime errors").toEqual([]);
});
