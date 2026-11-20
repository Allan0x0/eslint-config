import { test } from "@playwright/test";

test("unexplained", async () => {
  test.skip(!process.env.PROD, "production only");
  test.fixme(!process.env.MOBILE, "mobile only");
});

test("explained", async () => {
  // Page-weight budget only applies to the production build
  test.skip(!process.env.PROD, "production only");
  // This assertion is only meaningful on mobile viewports
  test.fixme(!process.env.MOBILE, "mobile only");
  test.skip(!process.env.WEBKIT, "webkit only"); // engine-specific screenshot baseline
});
