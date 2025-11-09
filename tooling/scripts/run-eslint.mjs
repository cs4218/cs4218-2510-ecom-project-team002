#!/usr/bin/env node
import { ESLint } from "eslint";

async function main() {
  const securityPlugin = await import("eslint-plugin-security");
  const nodePlugin = await import("eslint-plugin-node");

  const eslint = new ESLint({
    overrideConfigFile: true,
    allowInlineConfig: false,
    overrideConfig: {
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
          console: "readonly",
          module: "readonly",
          require: "readonly",
          process: "readonly",
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },

      plugins: {
        security: securityPlugin.default || securityPlugin,
        node: nodePlugin.default || nodePlugin,
      },

      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",

        "security/detect-eval-with-expression": "error",
        "security/detect-non-literal-regexp": "warn",
        "security/detect-non-literal-fs-filename": "warn",
        "security/detect-non-literal-require": "warn",
        "security/detect-object-injection": "warn",
        "security/detect-unsafe-regex": "warn",
        "security/detect-no-csrf-before-method-override": "warn",
        "security/detect-child-process": "error",
        "security/detect-buffer-noassert": "warn",
        "security/detect-disable-mustache-escape": "warn",
        "security/detect-new-buffer": "error",
        "security/detect-possible-timing-attacks": "warn",
      },
    },

    ignorePatterns: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**",
      "client/src/_site/**",
      "**/*.test.js",
    ],

    errorOnUnmatchedPattern: false,
  });

  const argvPatterns = process.argv.slice(2);

  const defaultDirs = [
    "client",
    "config",
    "controllers",
    "helpers",
    "middleware",
    "models",
    "routes",
  ];

  const patterns =
    argvPatterns.length > 0
      ? argvPatterns
      : defaultDirs.map((dir) => `${dir}/**/*.{js,cjs,mjs,ts,tsx}`);

  const results = await eslint.lintFiles(patterns);

  const formatter = await eslint.loadFormatter("stylish");
  const output = formatter.format(results);
  if (output && output.trim()) {
    console.log(output);
  }

  const errorResults = ESLint.getErrorResults(results);
  if (errorResults.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[sec:eslint] Security lint failed:", err);
  process.exitCode = 1;
});
