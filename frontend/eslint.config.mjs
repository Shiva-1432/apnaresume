import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    ".env*",
    "**/*.config.js",
    "**/*.config.ts",
    "**/*.config.mjs",
    "public/**",
    "coverage/**",
    ".git/**",
    "next-env.d.ts"
  ])
]);
