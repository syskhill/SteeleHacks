import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // keep Next’s presets
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // your project rules
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // make "any" not block builds (change to "warn" if you prefer)
      "@typescript-eslint/no-explicit-any": "off",

      // keep unused vars as warnings; allow underscore to indicate “intentionally unused”
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
    },
  },
];
