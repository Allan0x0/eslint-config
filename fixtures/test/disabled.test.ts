import { describe, it, expect } from "vitest";

describe("math", () => {
  it.skip("skipped", () => expect(1).toBe(1));
  it.only("focused", () => expect(1).toBe(1));
  it("retried", { retry: 3 }, () => expect(1).toBe(1));
});
