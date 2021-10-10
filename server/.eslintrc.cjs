module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: [".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "no-param-reassign": "warn",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        ts: "never",
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: ["./tsconfig.json", "../client/tsconfig.json"],
      },
    },
  },
};
