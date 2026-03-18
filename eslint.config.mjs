import tseslint from "typescript-eslint";
import globals from "globals";

export default [
    {
        ignores: [
            "dist/**",
            "build/**",
            "out/**",
            "coverage/**",
            "node_modules/**",
            ".vscode-test/**",
            "**/*.min.js",
            "**/*.d.ts"
        ]
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.mocha
            }
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin
        },
        rules: {}
    }
];
