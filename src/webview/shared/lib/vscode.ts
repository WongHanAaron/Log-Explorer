/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Thin wrapper around acquireVsCodeApi() that ensures the singleton is only
 * acquired once per webview document (calling it twice throws).
 */

declare function acquireVsCodeApi<S = unknown>(): VsCodeApi<S>;

export interface VsCodeApi<S = unknown> {
    postMessage(message: unknown): void;
    getState(): S | undefined;
    setState(state: S): void;
}

let _api: VsCodeApi<any> | undefined;

export function getVsCodeApi<S = unknown>(): VsCodeApi<S> {
    if (!_api) {
        // acquireVsCodeApi is injected by the VS Code webview host
        _api = (globalThis as any).acquireVsCodeApi();
    }
    return _api as VsCodeApi<S>;
}
