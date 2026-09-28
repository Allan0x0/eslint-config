# @allan/eslint-config

Shared ESLint flat config (ESLint 9+). Rule one: domain code returns `neverthrow` Results instead of throwing. `throw` fails lint through `functional/no-throw-statements`, except in framework-edge files (React Router routes, tRPC routers) that must throw `redirect(...)`, a `Response`, or `TRPCError`.

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

3. Baseline existing violations:

   ```sh
   pnpm exec eslint . --suppress-all
   ```

4. Commit the baseline:

   ```sh
   git add eslint-suppressions.json && git commit -m "Adopt @allan/eslint-config"
   ```

## Update

```sh
pnpm update @allan/eslint-config
```

## Extend the edge files

Edge globs are a named export: `app/routes/**`, `**/router.ts`, `**/routers/**`. Add your own:

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

Lints `fixtures/` and fails unless there is exactly one error: the domain `throw` in `fixtures/src/domain.ts`. The same `throw` in `fixtures/app/routes/home.ts` must lint clean.
