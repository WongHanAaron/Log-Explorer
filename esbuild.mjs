import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";
import { execSync, spawn } from "child_process";
import { resolve } from "path";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// ---------------------------------------------------------------------------
// Tailwind CSS
// ---------------------------------------------------------------------------

const tailwindBin = resolve("node_modules/.bin/tailwindcss");
const tailwindIn = "src/webview/shared/globals.css";
const tailwindOut = "dist/webview/shared.css";

function buildTailwindCss() {
    const minify = production ? " --minify" : "";
    execSync(`"${tailwindBin}" -i ${tailwindIn} -o ${tailwindOut}${minify}`, {
        stdio: "inherit",
        shell: true,
    });
}

function startTailwindWatch() {
    return spawn(tailwindBin, ["-i", tailwindIn, "-o", tailwindOut, "--watch"], {
        stdio: "inherit",
        shell: true,
    });
}

// ---------------------------------------------------------------------------
// Static assets
// ---------------------------------------------------------------------------

function copyAssets() {
    mkdirSync("dist", { recursive: true });
    mkdirSync("dist/webview", { recursive: true });
    copyFileSync("src/webview/styles.css", "dist/webview.css");
}

// ---------------------------------------------------------------------------
// esbuild configs
// ---------------------------------------------------------------------------

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

/** Shared base for all browser/webview bundles */
const webviewBase = {
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "ES2020",
    jsx: "automatic",
    sourcemap: !production,
    minify: production,
};

/** Legacy sidebar panel (vanilla TS — no JSX) */
const legacyWebviewConfig = {
    ...webviewBase,
    jsx: undefined,
    entryPoints: ["src/webview/main.ts"],
    outfile: "dist/webview.js",
};

/** React panel bundles — one per webview */
const panelConfigs = [
    { in: "src/webview/new-session/main.tsx", out: "dist/webview/new-session.js" },
    { in: "src/webview/session-templates/main.tsx", out: "dist/webview/session-templates.js" },
    { in: "src/webview/getting-started/main.tsx", out: "dist/webview/getting-started.js" },
    { in: "src/webview/log-file-lines/main.tsx", out: "dist/webview/log-file-lines.js" },
    { in: "src/webview/log-file-sources/main.tsx", out: "dist/webview/log-file-sources.js" },
    { in: "src/webview/session-tools/main.tsx", out: "dist/webview/session-tools.js" },
    { in: "src/webview/log-details/main.tsx", out: "dist/webview/log-details.js" },
    { in: "src/webview/search-results/main.tsx", out: "dist/webview/search-results.js" },
].map(({ in: input, out }) => ({ ...webviewBase, entryPoints: [input], outfile: out }));

const allWebviewConfigs = [legacyWebviewConfig, ...panelConfigs];

// ---------------------------------------------------------------------------
// Build / watch
// ---------------------------------------------------------------------------

async function main() {
    copyAssets();

    if (watch) {
        startTailwindWatch();
        buildTailwindCss();

        const contexts = await Promise.all([
            esbuild.context(extensionConfig),
            ...allWebviewConfigs.map(cfg => esbuild.context(cfg)),
        ]);
        await Promise.all(contexts.map(ctx => ctx.watch()));
        console.log("[watch] Build started...");
    } else {
        buildTailwindCss();
        await Promise.all([
            esbuild.build(extensionConfig),
            ...allWebviewConfigs.map(cfg => esbuild.build(cfg)),
        ]);
        console.log("[build] Build complete.");
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
