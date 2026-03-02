import * as vscode from 'vscode';
import { SourceLogConfigReference } from './sessionTemplates';

export interface SubmitSessionPayload {
    name: string;
    description: string;
    templateName: string | null;
    parameters: Record<string, string>;
    timeStart: string;
    sources: SourceLogConfigReference[];
}

export interface SessionSummary {
    name: string;
    description: string;
    folderName: string;
}

/**
 * Converts a session name to a kebab-case folder name.
 * e.g. "My Session 01!" → "my-session-01"
 */
export function toKebabCase(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Scans `.logex/sessions/` and returns a summary for every valid session folder.
 * Ignores subdirectories that lack a `session.json` or have a malformed one.
 */
export async function loadRecentSessions(workspaceRoot: vscode.Uri): Promise<SessionSummary[]> {
    const sessionsDir = vscode.Uri.joinPath(workspaceRoot, '.logex', 'sessions');

    let entries: [string, vscode.FileType][];
    try {
        entries = await vscode.workspace.fs.readDirectory(sessionsDir);
    } catch {
        return [];
    }

    const summaries: SessionSummary[] = [];

    for (const [folderName, fileType] of entries) {
        if (fileType !== vscode.FileType.Directory) {
            continue;
        }

        try {
            const sessionJsonUri = vscode.Uri.joinPath(sessionsDir, folderName, 'session.json');
            const bytes = await vscode.workspace.fs.readFile(sessionJsonUri);
            const raw = JSON.parse(Buffer.from(bytes).toString('utf8'));

            if (typeof raw.name === 'string') {
                summaries.push({
                    name: raw.name,
                    description: typeof raw.description === 'string' ? raw.description : '',
                    folderName,
                });
            }
        } catch {
            // No session.json or malformed — skip
        }
    }

    return summaries;
}

/**
 * Creates a new session folder under `.logex/sessions/<kebabName>/` and writes `session.json`.
 * Throws if a session with the derived folder name already exists.
 */
export async function createSession(
    workspaceRoot: vscode.Uri,
    data: SubmitSessionPayload
): Promise<SessionSummary> {
    const folderName = toKebabCase(data.name);
    if (!folderName) {
        throw new Error('Session name is required.');
    }

    const sessionDir = vscode.Uri.joinPath(workspaceRoot, '.logex', 'sessions', folderName);

    // Duplicate guard
    try {
        await vscode.workspace.fs.stat(sessionDir);
        // stat succeeded → folder already exists
        throw new Error(`A session named '${folderName}' already exists. Choose a different name.`);
    } catch (err: unknown) {
        // Re-throw the duplicate error we just created
        if (err instanceof Error && err.message.startsWith('A session named')) {
            throw err;
        }
        // Otherwise the folder doesn't exist — proceed
    }

    // Create the session directory (mkdirp semantics)
    await vscode.workspace.fs.createDirectory(sessionDir);

    const sessionJson = {
        name: data.name,
        description: data.description,
        templateName: data.templateName,
        parameters: data.parameters,
        timeStart: data.timeStart,
        sources: data.sources,
    };

    const sessionJsonUri = vscode.Uri.joinPath(sessionDir, 'session.json');
    await vscode.workspace.fs.writeFile(
        sessionJsonUri,
        Buffer.from(JSON.stringify(sessionJson, null, 2), 'utf8')
    );

    return {
        name: data.name,
        description: data.description,
        folderName,
    };
}
