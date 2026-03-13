// Minimal declaration for vscode namespace used by logger and tests
// Only includes the pieces referenced in the code; extend as needed.

declare namespace vscode {
    interface Disposable { dispose(): any; }
    interface OutputChannel {
        appendLine(value: string): void;
        show(preserveFocus?: boolean): void;
        dispose(): void;
    }
    interface WorkspaceConfiguration {
        get<T>(section: string, defaultValue?: T): T;
    }
    interface Workspace {
        getConfiguration(section?: string): WorkspaceConfiguration;
        onDidChangeConfiguration(listener: any): Disposable;
        workspaceFolders?: { uri: any }[];
        fs: {
            readDirectory(uri: any): Promise<any>;
            readFile(uri: any): Promise<Uint8Array>;
            createDirectory(uri: any): Promise<any>;
            stat(uri: any): Promise<any>;
            writeFile(uri: any, data: any): Promise<any>;
        };
    }
    interface Window {
        createOutputChannel(name: string, label?: string, options?: any): OutputChannel;
        showErrorMessage(message: string): any;
        createWebviewPanel(viewType: string, title: string, showOptions: any, options?: any): any;
    }
    const workspace: Workspace;
    const window: Window;
}

declare module 'vscode' {
    export = vscode;
}
