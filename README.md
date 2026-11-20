# @allan/eslint-config

Shared ESLint flat config (ESLint 9 and 10). It turns the mechanical review comments into lint errors, so an agent gets told to fix the root cause instead of being told twice in review.

| Rule | Where | What it stops | The fix it asks for |
| --- | --- | --- | --- |
| `functional/no-throw-statements` | source, except edge files | `throw` in domain code | Return a `neverthrow` Result |
| `no-restricted-properties` | source, not tests | `._unsafeUnwrap()`, `._unsafeUnwrapErr()` | Handle both cases with `.match()`, `.map()`/`.mapErr()`, `.andThen()`, or return the Result |
| `no-warning-comments` | all files | `todo`, `fixme`, `hack`, `xxx`, `workaround`, `for now`, `quick fix`, `temporary` | Fix it now or open an issue; don't leave a justification comment |
| `@eslint-community/eslint-comments/require-description` | all files | `eslint-disable` with no reason | Add `-- reason` after the directive |
| `@eslint-community/eslint-comments/no-unlimited-disable` | all files | bare `/* eslint-disable */` | Name the rules you disable |
| `vitest/no-disabled-tests`, `vitest/no-focused-tests` | Vitest tests | `.skip`, `.only`, `xit`, `fit` | Fix or delete the test |
| `playwright/no-skipped-test`, `playwright/no-focused-test` | Playwright specs | `test.skip`, `test.fixme`, `test.only` | Fix or delete the test |
| `playwright/no-wait-for-timeout` | Playwright specs | `page.waitForTimeout()` | Wait for a locator, response or event |
| `no-restricted-syntax` | tests and test runner configs | `retry` / `retries` keys | Fix the flake's root cause (missing await, race, shared state, real timers or network) |

`no-warning-comments` and the plugin rules print their own messages. The custom messages (`_unsafeUnwrap`, retries) name the root-cause fix.

## Presets

| Export | Contents |
| --- | --- |
| default | `base` + `testHygiene` |
| `base` | throw ban, unwrap ban, warning comments, eslint-disable hygiene |
| `testHygiene` | test-file rules only: no skipped, focused, sleeping or retried tests |

Globs are named exports too: `edgeFileGlobs`, `testFileGlobs`, `playwrightFileGlobs`, `testConfigGlobs`.

## Adopt

1. Install:

   ```sh
   pnpm add -D github:Allan0x0/eslint-config
   ```

2. Spread into `eslint.config.js`:

   ```js
   import allan from "@allan/eslint-config";
   export default [...allan];
   ```

   Only the test rules (for a repo not ready for the full set):

   ```js
   import { testHygiene } from "@allan/eslint-config";
   export default [...yourConfig, ...testHygiene];
   ```

3. Baseline existing violations:

   ```sh
   pnpm exec eslint . --suppress-all
   ```

4. Commit the baseline:

   ```sh
   git add eslint-suppressions.json && git commit -m "Adopt @allan/eslint-config"
   ```

Note: `testHygiene` sets `no-restricted-syntax` on test files. If your own config also sets `no-restricted-syntax` for those files, the later block wins; merge the selectors into one list.

## Update

```sh
pnpm update @allan/eslint-config
```

After an update, re-run `pnpm exec eslint . --suppress-all` only for rules that are new in that version, and commit the baseline. Clean up the baseline over time instead of growing it.

## Extend the edge files

```js
import allan, { edgeFileGlobs } from "@allan/eslint-config";

export default [
  ...allan,
  {
    files: [...edgeFileGlobs, "server/trpc/**"],
    rules: { "functional/no-throw-statements": "off" },
  },
];
```

## Check

```sh
pnpm test
```

Lints `fixtures/` with the full config and then with `testHygiene` alone. Each run compares every finding (file, line, rule) against the expected list in `check.js` and fails on anything missing or extra, or on a custom message that doesn't name the fix. One fixture per rule; `fixtures/app/routes/home.ts` and `fixtures/test/unwrap-allowed.test.ts` must lint clean. CI runs it on ESLint 9 and 10.

## Changelog

- 1.1.1: `playwright/no-skipped-test` also bans `test.fixme`.
- 1.1.0: test hygiene preset (Vitest, Playwright, retries), `_unsafeUnwrap` ban, warning-comment ban, eslint-disable descriptions; `base` and `testHygiene` exports; per-rule fixtures; CI on ESLint 9 and 10.
- 1.0.0: `functional/no-throw-statements` with edge-file override.
