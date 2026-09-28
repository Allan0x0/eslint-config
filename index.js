import functional from "eslint-plugin-functional";
import tseslint from "typescript-eslint";

// Framework-edge files: React Router route modules and tRPC routers must throw
// redirect(...), a Response, or TRPCError. Spread this into your own config to extend it.
export const edgeFileGlobs = ["app/routes/**", "**/router.ts", "**/routers/**"];

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { functional },
    rules: {
      // Domain code returns neverthrow Results instead of throwing.
      "functional/no-throw-statements": "error",
    },
  },
  {
    files: edgeFileGlobs,
    rules: { "functional/no-throw-statements": "off" },
  },
];
