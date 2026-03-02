import * as vscode from 'vscode';

export interface SourceLogConfigReference {
    type: 'file' | 'kibana';
    sourceConfig: string;
    logConfig: string;
}

export interface SessionTemplate {
    id: string;
    name: string;
    description: string;
    parameters: Array<{ name: string }>;
    sources: SourceLogConfigReference[];
}

/**
 * Reads all session templates from `.logex/session-templates/*.json`.
 * Returns an empty array if the directory does not exist.
 * Silently skips files that are malformed or fail validation.
 */
export async function loadTemplates(workspaceRoot: vscode.Uri): Promise<SessionTemplate[]> {
    const templatesDir = vscode.Uri.joinPath(workspaceRoot, '.logex', 'session-templates');

    let entries: [string, vscode.FileType][];
    try {
        entries = await vscode.workspace.fs.readDirectory(templatesDir);
    } catch {
        // Directory does not exist or is inaccessible — return empty list
        return [];
    }

    const templates: SessionTemplate[] = [];

    for (const [filename, fileType] of entries) {
        if (fileType !== vscode.FileType.File || !filename.endsWith('.json')) {
            continue;
        }

        try {
            const fileUri = vscode.Uri.joinPath(templatesDir, filename);
            const bytes = await vscode.workspace.fs.readFile(fileUri);
            const raw = JSON.parse(Buffer.from(bytes).toString('utf8'));

            // Validate required top-level fields
            if (
                typeof raw.name !== 'string' || !raw.name ||
                typeof raw.description !== 'string' ||
                !Array.isArray(raw.parameters) ||
                !Array.isArray(raw.sources)
            ) {
                continue;
            }

            // Validate parameters
            const parameters: Array<{ name: string }> = [];
            for (const p of raw.parameters) {
                if (typeof p?.name === 'string' && p.name) {
                    parameters.push({ name: p.name });
                }
            }

            // Validate sources — each must be a SourceLogConfigReference
            const sources: SourceLogConfigReference[] = [];
            for (const s of raw.sources) {
                if (
                    (s?.type === 'file' || s?.type === 'kibana') &&
                    typeof s.sourceConfig === 'string' && s.sourceConfig &&
                    typeof s.logConfig === 'string' && s.logConfig
                ) {
                    sources.push({
                        type: s.type,
                        sourceConfig: s.sourceConfig,
                        logConfig: s.logConfig,
                    });
                }
            }

            templates.push({
                id: filename.replace(/\.json$/, ''),
                name: raw.name,
                description: raw.description,
                parameters,
                sources,
            });
        } catch {
            // JSON parse error or I/O error — skip this file
        }
    }

    return templates;
}
