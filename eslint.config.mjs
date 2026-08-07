import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // scripts/ は node で直接動かす CommonJS のツール、public/ はバンドルを通さず
    // 素のまま配信されるブラウザ用スクリプト。どちらも Next のアプリコードではないので
    // ESM 前提のルールは当てない。ここを無視対象にせず個別に外すのは、
    // 未使用変数などの実のあるチェックは効かせたままにするため。
    files: ["scripts/**/*.js", "public/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // catch (e) で e を使わない書き方は許す
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
]);

export default eslintConfig;
