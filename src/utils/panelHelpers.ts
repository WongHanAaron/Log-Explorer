import * as vscode from 'vscode';

/**
 * Utility to wrap common registration boilerplate for a webview panel.
 * The caller provides a factory that constructs the panel instance when
 * the command is invoked; this helper registers the corresponding command
 * and returns the disposable.
 */
export function registerPanelCommand(
    command: string,
    factory: (extensionUri: vscode.Uri, shortName?: string) => unknown
): vscode.Disposable {
    return vscode.commands.registerCommand(command, async (...args: any[]) => {
        const extensionUri = args[0] as vscode.Uri; // consumers pass it first
        const shortName = args[1] as string | undefined;
        factory(extensionUri, shortName);
    });
}

/**
 * Narrow a generic message to the known protocol types.
 */
export function isSelectConfigMessage(msg: any): msg is { type: 'selectConfig'; name: string } {
    return msg && msg.type === 'selectConfig' && typeof msg.name === 'string';
}

export function isLogMessage(msg: any): msg is { type: 'log'; level: string; text: string; scope?: string } {
    return msg && msg.type === 'log' && typeof msg.level === 'string' && typeof msg.text === 'string';
}
