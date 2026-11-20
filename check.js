// Lints fixtures/ and compares every finding (file:line rule) against an expected list.
// Runs twice: the full config, and the testHygiene preset on its own.
import { ESLint } from "eslint";
import config, { testHygiene } from "./index.js";

const unwrap = "throws on the wrong variant. Handle both cases";
const retry = "Fix the root cause of the flake";

const testFindings = [
  ["e2e/checkout.spec.ts:3", "no-restricted-syntax", retry],
  ["e2e/checkout.spec.ts:4", "playwright/no-skipped-test"],
  ["e2e/checkout.spec.ts:5", "playwright/no-focused-test"],
  ["e2e/checkout.spec.ts:6", "playwright/no-wait-for-timeout"],
  ["e2e/checkout.spec.ts:8", "playwright/no-skipped-test"],
  ["playwright.config.ts:1", "no-restricted-syntax", retry],
  ["test/disabled.test.ts:4", "vitest/no-disabled-tests"],
  ["test/disabled.test.ts:5", "vitest/no-focused-tests"],
  ["test/disabled.test.ts:6", "no-restricted-syntax", retry],
];

const fullFindings = [
  ...testFindings,
  ["src/domain.ts:2", "functional/no-throw-statements"],
  ["src/eslint-comments.ts:2", "@eslint-community/eslint-comments/require-description"],
  ["src/unlimited-disable.ts:1", "@eslint-community/eslint-comments/no-unlimited-disable"],
  ["src/unwrap.ts:2", "no-restricted-properties", unwrap],
  ["src/unwrap.ts:3", "no-restricted-properties", unwrap],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((line) => [`src/warning-comments.ts:${line}`, "no-warning-comments"]),
];

const fixtures = new URL("./fixtures/", import.meta.url).pathname;

async function check(name, overrideConfig, expected) {
  const eslint = new ESLint({ cwd: fixtures, overrideConfigFile: true, overrideConfig });
  const results = await eslint.lintFiles(["."]);
  const actual = results.flatMap((r) =>
    r.messages.map((m) => ({
      key: `${r.filePath.slice(fixtures.length)}:${m.line} ${m.ruleId}`,
      message: m.message,
    })),
  );
  const want = expected.map(([at, rule]) => `${at} ${rule}`);
  const got = actual.map((a) => a.key);
  const missing = want.filter((k) => !got.includes(k));
  const extra = got.filter((k) => !want.includes(k));
  const badMessages = expected
    .filter(([, , text]) => text)
    .filter(([at, rule, text]) => !actual.some((a) => a.key === `${at} ${rule}` && a.message.includes(text)))
    .map(([at, rule]) => `${at} ${rule}`);

  if (missing.length || extra.length || badMessages.length) {
    console.error(`FAIL ${name}`);
    for (const k of missing) console.error(`  missing: ${k}`);
    for (const k of extra) console.error(`  unexpected: ${k}`);
    for (const k of badMessages) console.error(`  message lacks the root-cause fix: ${k}`);
    return false;
  }
  console.log(`PASS ${name}: ${got.length} findings match the expected list`);
  return true;
}

console.log(`ESLint ${ESLint.version}`);
const ok = [
  await check("full config", config, fullFindings),
  await check("testHygiene preset", testHygiene, testFindings),
];
if (ok.includes(false)) process.exit(1);
