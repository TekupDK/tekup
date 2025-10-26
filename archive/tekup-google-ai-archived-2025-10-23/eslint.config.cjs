const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const vitestPlugin = require("eslint-plugin-vitest");
const globals = require("globals");

const baseTypeScriptRules = {
    ...js.configs.recommended.rules,
    ...tsPlugin.configs.recommended.rules,
    ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-unused-vars": [
        "error",
        {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        },
    ],
};

module.exports = [
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: baseTypeScriptRules,
    },
    {
        files: ["client/**/*.ts", "client/**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: baseTypeScriptRules,
    },
    {
        files: ["tests/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
                ...vitestPlugin.environments.env.globals,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            vitest: vitestPlugin,
        },
        rules: {
            ...baseTypeScriptRules,
            ...vitestPlugin.configs.recommended.rules,
        },
    },
    {
        files: ["**/*.d.ts"],
        rules: {
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "no-redeclare": "off",
        },
    },
    {
        files: ["client/vite.config.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "client/tsconfig.node.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: baseTypeScriptRules,
    },
];
