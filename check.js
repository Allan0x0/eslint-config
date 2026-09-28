// Lints the fixtures and asserts exactly one error: the domain throw.
import { ESLint } from "eslint";
import config from "./index.js";

const eslint = new ESLint({
  cwd: new URL("./fixtures", import.meta.url).pathname,
  overrideConfigFile: true,
  overrideConfig: config,
});
const results = await eslint.lintFiles(["."]);
const errors = results.flatMap((r) => r.messages.map((m) => ({ file: r.filePath, ...m })));
console.log((await eslint.loadFormatter("stylish")).format(results));

const ok =
  errors.length === 1 &&
  errors[0].ruleId === "functional/no-throw-statements" &&
  errors[0].file.endsWith("src/domain.ts");
if (!ok) {
  console.error(`FAIL: expected exactly 1 functional/no-throw-statements error in src/domain.ts, got ${errors.length}`);
  process.exit(1);
}
console.log("PASS: 1 error, functional/no-throw-statements in src/domain.ts; edge file clean");
