module.exports = {
  ignorePatterns: ["dist"],
  extends: ["eslint:recommended", "plugin:prettier/recommended", "preact"],
  parserOptions: {
    sourceType: "module",
  },
  env: {
    browser: true,
    es2020: true,
  },
  rules: {
    "no-console": "error",
    "no-else-return": "off",
  },

  // Required to fix eslint-config-preact error
  settings: {
    jest: {
      version: "latest",
    },
  },
};
