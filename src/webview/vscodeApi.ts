// Singleton helper to obtain the VS Code webview API.  Calling
// `acquireVsCodeApi()` more than once in the same document throws an error,
// so we cache the value here.

// We deliberately avoid calling `acquireVsCodeApi()` at module evaluation time to
// make the import side-effect free; consumers fetch the instance when needed.

let vscodeInstance: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVsCodeApi(): any {
    if (!vscodeInstance) {
        // `acquireVsCodeApi` is injected by VS Code in the webview context.
        // The global declaration is provided via `declare` in client code.
        // We cast to `any` so tests can override the function.
        // @ts-ignore
        vscodeInstance = acquireVsCodeApi();
    }
    return vscodeInstance;
}
