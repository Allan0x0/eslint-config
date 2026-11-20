import { test } from "@playwright/test";

test.describe.configure({ retries: 2 });
test.skip("skipped", async () => {});
test.only("focused", async ({ page }) => {
  await page.waitForTimeout(1000);
});
