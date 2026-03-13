// Minimal vscode stub for unit tests
// Exports only the pieces needed by tests.  Interfaces are intentionally loose
// so we can mutate the objects in tests without full implementation.

export interface OutputChannel {
    name: string;
    append(value: string): void;
    appendLine(value: string): void;
    clear(): void;
    show(preserveFocus?: boolean): void;
    hide(): void;
    dispose(): void;
}

export interface ConfigurationChangeEvent {
    affectsConfiguration(section: string): boolean;
}

export interface WorkspaceConfiguration {
    get<T>(section: string, defaultValue?: T): T;
}

export const window = {
    createOutputChannel: (name: string): OutputChannel => {
        // stub implementation, tests will often replace this with their own fake
        return {
            name,
            append: () => { },
            appendLine: () => { },
            clear: () => { },
            show: () => { },
            hide: () => { },
            dispose: () => { },
        };
    }
};

export const workspace: {
    getConfiguration: () => WorkspaceConfiguration;
    onDidChangeConfiguration: (callback: (e: ConfigurationChangeEvent) => void) => { dispose(): void };
} = {
    getConfiguration: () => ({ get: (_: string, def?: any) => def }),
    onDidChangeConfiguration: (_cb) => ({ dispose() { } }),
};

export const Uri = {
    file: (f: string) => ({ fsPath: f, path: f } as any),
    joinPath: (...parts: string[]) => ({ fsPath: parts.join('/'), path: parts.join('/') } as any)
};

export class Disposable {
    constructor(func?: () => void) { }
    dispose() { }
}

// basic webview interfaces used by panel tests
export interface Webview {
    html: string;
    onDidReceiveMessage(cb: (msg: any) => any, _?: any, __?: any): Disposable;
    postMessage(msg: any): Thenable<boolean>;
    asWebviewUri(uri: any): any;
    cspSource?: string;
}

export interface WebviewPanel {
    webview: Webview;
    dispose(): void;
    onDidDispose(cb: () => any): Disposable;
}

// re-export enums or constants as needed
export const ConfigurationTarget = {
    Global: 1,
    Workspace: 2,
};

// other pieces may be added as tests reference them
