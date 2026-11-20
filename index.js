import comments from "@eslint-community/eslint-plugin-eslint-comments";
import vitest from "@vitest/eslint-plugin";
import functional from "eslint-plugin-functional";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

// Framework-edge files: React Router route modules and tRPC routers must throw
// redirect(...), a Response, or TRPCError. Spread this into your own config to extend it.
export const edgeFileGlobs = ["app/routes/**", "**/router.ts", "**/routers/**"];

// Playwright specs. Vitest rules skip these so a skipped e2e test reports once, not twice.
export const playwrightFileGlobs = ["e2e/**", "**/e2e/**", "playwright/**", "**/*.e2e.{js,ts,mjs,mts}"];

// Unit and integration tests (Vitest), plus the Playwright specs above.
export const testFileGlobs = [
  "**/*.{test,spec}.{js,mjs,cjs,jsx,ts,mts,cts,tsx}",
  "**/__tests__/**",
  ...playwrightFileGlobs,
];

// Test runner config files, where suite-wide retries usually hide.
export const testConfigGlobs = ["**/playwright.config.*", "**/vitest.config.*", "**/vitest.workspace.*", "**/vite.config.*"];

const sourceFiles = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"];
const tsParser = { parser: tseslint.parser };

const retryMessage =
  "Retries hide flaky tests. Fix the root cause of the flake (missing await, race, shared state, real timers or network) and delete the retry.";

const noRetryKeys = [
  "error",
  { selector: "Property[key.name=/^retr(y|ies)$/]", message: retryMessage },
  { selector: "Property[key.value=/^retr(y|ies)$/]", message: retryMessage },
];

// Test hygiene: no skipped, focused, sleeping or retried tests.
// Usable on its own: `export default [...testHygiene]`.
export const testHygiene = [
  {
    files: testFileGlobs,
    ignores: playwrightFileGlobs,
    languageOptions: tsParser,
    plugins: { vitest },
    rules: {
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
    },
  },
  {
    files: playwrightFileGlobs,
    languageOptions: tsParser,
    plugins: { playwright },
    rules: {
      "playwright/no-skipped-test": ["error", { disallowFixme: true }],
      "playwright/no-focused-test": "error",
      "playwright/no-wait-for-timeout": "error",
    },
  },
  {
    files: [...testFileGlobs, ...testConfigGlobs],
    languageOptions: tsParser,
    rules: { "no-restricted-syntax": noRetryKeys },
  },
];

const unwrapMessage = (name) =>
  `${name} throws on the wrong variant. Handle both cases with .match(), .map()/.mapErr() or .andThen(), or return the Result to the caller. Tests may use it.`;

export const base = [
  {
    files: sourceFiles,
    languageOptions: tsParser,
    plugins: { functional, "@eslint-community/eslint-comments": comments },
    rules: {
      // Domain code returns neverthrow Results instead of throwing.
      "functional/no-throw-statements": "error",
      // Deferred-fix markers are where slop hides. Fix it now or open an issue.
      "no-warning-comments": [
        "error",
        {
          terms: ["todo", "fixme", "hack", "xxx", "workaround", "for now", "quick fix", "temporary"],
          location: "anywhere",
        },
      ],
      // Every disable says why, and never disables everything.
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
    },
  },
  {
    files: sourceFiles,
    ignores: testFileGlobs,
    rules: {
      "no-restricted-properties": [
        "error",
        { property: "_unsafeUnwrap", message: unwrapMessage("_unsafeUnwrap()") },
        { property: "_unsafeUnwrapErr", message: unwrapMessage("_unsafeUnwrapErr()") },
      ],
    },
  },
  {
    files: edgeFileGlobs,
    rules: { "functional/no-throw-statements": "off" },
  },
];

export default [...base, ...testHygiene];
