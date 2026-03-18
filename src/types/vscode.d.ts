// Minimal augmentation of VS Code types for this codebase.
// Prefer the official @types/vscode definitions; augment only missing pieces.

import 'vscode';

declare global {
    namespace vscode {
        // Provide a global namespace for legacy code that uses `vscode.*` types directly.
        // The real types come from @types/vscode; these declarations are only to avoid
        // "Cannot find namespace 'vscode'" errors.
        interface Disposable { dispose(): void; }
        interface OutputChannel {
            appendLine(value: string): void;
            show(preserveFocus?: boolean): void;
            dispose(): void;
        }
        interface Workspace {
            onDidChangeWorkspaceFolders?(listener: any): Disposable;
            createFileSystemWatcher?(globPattern: string): any;
        }
        interface Window {
            registerWebviewViewProvider?(viewId: string, provider: any, options?: any): Disposable;
            showInformationMessage?(message: string, ...items: any[]): Thenable<any>;
        }
    }
}
