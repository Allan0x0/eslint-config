import { describe, it, expect } from "vitest";

describe("math", () => {
  it.skip("skipped", () => expect(1).toBe(1));
  it.only("focused", () => expect(1).toBe(1));
  it("retried", { retry: 3 }, () => expect(1).toBe(1));
  it("no retry", { retry: 0 }, () => expect(1).toBe(1));
  it.skipIf(process.env.CI)("unexplained", () => expect(1).toBe(1));
  // Only the production build is measured
  it.skipIf(process.env.DEV)("explained", () => expect(1).toBe(1));
});
