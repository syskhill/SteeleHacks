import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Use ONE compat.config block so rules merge over Next presets
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // kill the two blockers everywhere
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // (optional) keep these off if you disabled them earlier
      "@next/next/google-font-display": "off",
      "@next/next/google-font-preconnect": "off",
      "@next/next/inline-script-id": "off",
      "@next/next/next-script-for-ga": "off",
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-async-client-component": "off",
      "@next/next/no-before-interactive-script-outside-document": "off",
      "@next/next/no-css-tags": "off",
      "@next/next/no-document-import-in-page": "off",
      "@next/next/no-duplicate-head": "off",
      "@next/next/no-head-element": "off",
      "@next/next/no-head-import-in-document": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      "@next/next/no-script-component-in-head": "off",
      "@next/next/no-styled-jsx-in-document": "off",
      "@next/next/no-sync-scripts": "off",
      "@next/next/no-title-in-document-head": "off",
      "@next/next/no-typos": "off",
      "@next/next/no-unwanted-polyfillio": "off",
    },
  }),
];
