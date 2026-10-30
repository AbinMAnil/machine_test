import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "web/frontend/**",
      "extensions/*/assets/*.js",
      "coverage/**",
      ".shopify/**",
    ],
  },
];
