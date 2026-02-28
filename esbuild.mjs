import * as esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

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

async function main() {
  if (watch) {
    const [extCtx, webCtx] = await Promise.all([
      esbuild.context(extensionConfig),
      esbuild.context(webviewConfig),
    ]);
    await Promise.all([extCtx.watch(), webCtx.watch()]);
    console.log("[watch] Build started...");
  } else {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(webviewConfig),
    ]);
    console.log("[build] Build complete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
