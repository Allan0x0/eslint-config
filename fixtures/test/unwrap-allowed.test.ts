import { it, expect } from "vitest";

declare const result: { _unsafeUnwrap(): number };
it("tests may unwrap", () => expect(result._unsafeUnwrap()).toBe(1));
