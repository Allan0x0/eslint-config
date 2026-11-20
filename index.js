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

// Literal 0 is allowed (`retries: 0`, `retry: 0`). Any other value, including
// an expression such as `process.env.CI ? 2 : 0`, is flagged.
const zeroLiteral = "[value.type='Literal'][value.value=0]";
const noRetryKeys = [
  "error",
  { selector: `Property[key.name=/^retr(y|ies)$/]:not(${zeroLiteral})`, message: retryMessage },
  { selector: `Property[key.value=/^retr(y|ies)$/]:not(${zeroLiteral})`, message: retryMessage },
];

const skipReasonMessage =
  "Conditional skips need a comment next to them that says why. Fix the test so it can always run, or keep the skip and explain the real constraint (for example a production-only budget or a platform that does not apply).";

const skipNames = new Set(["skip", "fixme", "skipIf"]);
const testRoots = new Set(["test", "it", "describe"]);

function memberName(node) {
  if (node?.type !== "MemberExpression") return null;
  const property = node.property;
  if (property.type === "Identifier" && !node.computed) return property.name;
  if (property.type === "Literal" && typeof property.value === "string") return property.value;
  return null;
}

function rootIdentifier(node) {
  let current = node;
  while (current?.type === "MemberExpression") current = current.object;
  return current?.type === "Identifier" ? current.name : null;
}

function isStringNode(node) {
  return (
    (node.type === "Literal" && typeof node.value === "string") ||
    node.type === "TemplateLiteral"
  );
}

function isFunctionNode(node) {
  return node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression";
}

function isConditionalSkip(node, name) {
  if (name === "skipIf") return true;
  const args = node.arguments;
  if (args.length === 0) {
    return Boolean(enclosingBranch(node));
  }
  const first = args[0];
  // A string title or a test body is an unconditional skipped test, not a condition.
  if (isStringNode(first) || isFunctionNode(first)) return false;
  return true;
}

function enclosingBranch(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "IfStatement" || current.type === "SwitchCase") return current;
    if (current.type === "FunctionExpression" || current.type === "ArrowFunctionExpression" || current.type === "FunctionDeclaration") {
      return null;
    }
  }
  return null;
}

function isReasonComment(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^eslint(?:-|$)/.test(trimmed)) return false;
  return true;
}

function hasReasonComment(sourceCode, node) {
  const seen = new Set();
  const comments = [];
  const add = (list) => {
    for (const comment of list) {
      if (seen.has(comment)) continue;
      seen.add(comment);
      comments.push(comment);
    }
  };

  let current = node;
  while (current) {
    add(sourceCode.getCommentsBefore(current));
    // Trailing comments on the same line count; a comment on the next
    // line belongs to the following statement, not this one.
    add(
      sourceCode.getCommentsAfter(current).filter(
        (comment) => comment.loc.start.line === current.loc.end.line,
      ),
    );
    if (
      current.type === "ExpressionStatement" ||
      current.type === "ReturnStatement" ||
      current.type === "VariableDeclaration"
    ) {
      break;
    }
    current = current.parent;
  }

  const branch = enclosingBranch(node);
  if (branch) {
    add(sourceCode.getCommentsBefore(branch));
  }

  return comments.some((comment) => isReasonComment(comment.value));
}

const requireSkipReason = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require an explanatory comment next to a conditional test.skip or test.fixme",
    },
    messages: {
      needsReason: skipReasonMessage,
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const name = memberName(node.callee);
        if (!skipNames.has(name)) return;
        if (!testRoots.has(rootIdentifier(node.callee))) return;
        if (!isConditionalSkip(node, name)) return;
        if (hasReasonComment(context.sourceCode, node)) return;
        context.report({ node, messageId: "needsReason" });
      },
    };
  },
};

const allan = {
  meta: { name: "allan", version: "1.1.2" },
  rules: { "require-skip-reason": requireSkipReason },
};

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
      // allowConditional lets test.skip(cond, ...) through; require-skip-reason
      // then demands an adjacent comment that says why. Plain test.skip() stays banned.
      "playwright/no-skipped-test": ["error", { disallowFixme: true, allowConditional: true }],
      "playwright/no-focused-test": "error",
      "playwright/no-wait-for-timeout": "error",
    },
  },
  {
    files: [...testFileGlobs, ...testConfigGlobs],
    languageOptions: tsParser,
    plugins: { allan },
    rules: {
      "no-restricted-syntax": noRetryKeys,
      "allan/require-skip-reason": "error",
    },
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
