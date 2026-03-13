import { LogLevel, LogLevel as LL } from './logger.ts';

export interface LogMessagePayload {
    type: 'log';
    level: LogLevel;
    text: string;
    scope?: string;
}

export function isLogMessage(obj: unknown): obj is LogMessagePayload {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as any;
    if (o.type !== 'log') return false;
    if (typeof o.text !== 'string') return false;
    if (typeof o.level !== 'string') return false;
    if (![LL.Info, LL.Warn, LL.Error, LL.Debug].includes(o.level)) return false;
    if (o.scope !== undefined && typeof o.scope !== 'string') return false;
    return true;
}
