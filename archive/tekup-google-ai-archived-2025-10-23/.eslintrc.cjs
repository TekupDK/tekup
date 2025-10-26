module.exports = {
    root: true,
    env: {
        es2021: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
    ],
    ignorePatterns: ["dist", "node_modules", "client/dist", "client/node_modules"],
    overrides: [
        {
            files: ["tests/**/*.ts"],
            env: {
                "vitest/globals": true,
            },
            plugins: ["@typescript-eslint", "vitest"],
            extends: ["plugin:vitest/recommended"],
        },
    ],
};
