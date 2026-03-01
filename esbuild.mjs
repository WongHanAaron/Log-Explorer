import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/** Copy static assets to dist/ */
function copyAssets() {
    mkdirSync("dist", { recursive: true });
    mkdirSync("dist/webview", { recursive: true });
    copyFileSync("src/webview/styles.css", "dist/webview.css");
    copyFileSync("src/webview/new-session/styles.css", "dist/webview/new-session.css");
}

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outfile: "dist/extension.js",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    target: "ES2020",
    sourcemap: !production,
    minify: production,
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
    entryPoints: ["src/webview/main.ts"],
    bundle: true,
    outfile: "dist/webview.js",
    format: "iife",
    platform: "browser",
    target: "ES2020",
    sourcemap: !production,
    minify: production,
};

/** @type {import('esbuild').BuildOptions} */
const newSessionWebviewConfig = {
    entryPoints: ["src/webview/new-session/main.ts"],
    bundle: true,
    outfile: "dist/webview/new-session.js",
    format: "iife",
    platform: "browser",
    target: "ES2020",
    sourcemap: !production,
    minify: production,
};

async function main() {
    copyAssets();

    if (watch) {
        const [extCtx, webCtx, newSessionCtx] = await Promise.all([
            esbuild.context(extensionConfig),
            esbuild.context(webviewConfig),
            esbuild.context(newSessionWebviewConfig),
        ]);
        await Promise.all([extCtx.watch(), webCtx.watch(), newSessionCtx.watch()]);
        console.log("[watch] Build started...");
    } else {
        await Promise.all([
            esbuild.build(extensionConfig),
            esbuild.build(webviewConfig),
            esbuild.build(newSessionWebviewConfig),
        ]);
        console.log("[build] Build complete.");
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
