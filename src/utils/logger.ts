import * as vscode from 'vscode';

// a small enum-like object so we can refer to the levels in a type-safe way
export const LogLevel = {
    Info: 'info',
    Warn: 'warn',
    Error: 'error',
    Debug: 'debug',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// numeric ranking used for threshold comparisons
const LEVEL_RANK: Record<LogLevel, number> = {
    [LogLevel.Debug]: 0,
    [LogLevel.Info]: 1,
    [LogLevel.Warn]: 2,
    [LogLevel.Error]: 3,
};

interface Config {
    logLevel: LogLevel;
    allowedScopes: string[] | undefined;
    deniedScopes: string[] | undefined;
}

function readConfig(): Config {
    const cfg = vscode.workspace.getConfiguration('logExplorer');
    const logLevel = cfg.get<LogLevel>('logLevel', LogLevel.Info);
    const allowedScopes = cfg.get<string[]>('allowedScopes');
    const deniedScopes = cfg.get<string[]>('deniedScopes');
    return { logLevel, allowedScopes, deniedScopes };
}

export class OutputLogger implements vscode.Disposable {
    private channel: vscode.OutputChannel | undefined;
    private config: Config;
    private disposables: vscode.Disposable[] = [];

    constructor(private readonly scope?: string) {
        this.config = readConfig();
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('logExplorer')) {
                    this.config = readConfig();
                }
            })
        );
    }

    /**
     * Dispose the channel and all internal listeners.  Used when the extension
     * shuts down or the logger is no longer needed.
     */
    public dispose() {
        this.close();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }

    /**
     * Close only the output channel but keep configuration listeners alive.
     * This is useful for a "hide" command without killing the logger itself.
     */
    public close() {
        this.channel?.dispose();
        this.channel = undefined;
    }

    public show(preserveFocus = true) {
        this.getChannel().show(preserveFocus);
    }

    private getChannel(): vscode.OutputChannel {
        if (!this.channel) {
            // request a "log" channel which understands ANSI escape sequences.
            // the options argument is not currently typed, so cast the factory
            // to `any` before invoking to suppress errors.
            const create: any = vscode.window.createOutputChannel;
            this.channel = create('Log Explorer', 'log', { log: true });
        }
        return this.channel!;
    }

    private shouldLog(level: LogLevel, scope?: string): boolean {
        // level threshold
        if (LEVEL_RANK[level] < LEVEL_RANK[this.config.logLevel]) {
            return false;
        }
        const effectiveScope = scope || this.scope;
        if (effectiveScope) {
            if (this.config.allowedScopes && this.config.allowedScopes.length > 0) {
                if (!this.config.allowedScopes.includes(effectiveScope)) {
                    return false;
                }
            }
            if (this.config.deniedScopes && this.config.deniedScopes.length > 0) {
                if (this.config.deniedScopes.includes(effectiveScope)) {
                    return false;
                }
            }
        }
        return true;
    }


    private formatLine(
        level: LogLevel,
        message: string,
        scope?: string,
        err?: unknown
    ): string {
        const time = new Date().toISOString();
        const parts: string[] = [];
        parts.push(time);
        parts.push(`[${level}]`);
        const effectiveScope = scope || this.scope;
        if (effectiveScope) {
            parts.push(`[${effectiveScope}]`);
        }
        parts.push(message);
        let line = parts.join(' ');
        if (err instanceof Error) {
            line += `\n${err.message}`;
            if (err.stack) {
                line += `\n${err.stack}`;
            }
        } else if (err !== undefined) {
            // log whatever was passed
            line += `\n${String(err)}`;
        }
        return line;
    }

    /**
     * Generic log method. `scope` and `err` are optional.
     */
    /**
     * Generic log method. scope is optional and may override the instance's
     * default scope.  Errors should be passed via `error()` helper.
     */
    public log(level: LogLevel, message: string, scope?: string): void {
        if (!this.shouldLog(level, scope)) {
            return;
        }
        const line = this.formatLine(level, message, scope);
        this.getChannel().appendLine(line);
    }

    // convenience helpers with minimal signatures
    public debug(message: string, scope?: string) {
        return this.log(LogLevel.Debug, message, scope);
    }

    public info(message: string, scope?: string) {
        return this.log(LogLevel.Info, message, scope);
    }

    public warn(message: string, scope?: string) {
        return this.log(LogLevel.Warn, message, scope);
    }

    public error(message: string, err?: unknown) {
        // logMessage will include error details if provided
        if (!this.shouldLog(LogLevel.Error, undefined)) {
            return;
        }
        const line = this.formatLine(LogLevel.Error, message, undefined, err);
        this.getChannel().appendLine(line);
    }
}

// singleton instance for easy use
export const logger = new OutputLogger();
