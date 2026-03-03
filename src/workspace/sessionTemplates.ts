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

/**
 * Creates a new session template JSON file in `.logex/session-templates/`.
 * The template ID is derived from the name (kebab-case) and must be unique.
 * Returns the fully-populated template (including the assigned `id`).
 * Throws if a template with the same id already exists.
 */
export async function createTemplate(
    workspaceRoot: vscode.Uri,
    data: Omit<SessionTemplate, 'id'>
): Promise<SessionTemplate> {
    const id = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    if (!id) {
        throw new Error('Template name is required.');
    }

    const templatesDir = vscode.Uri.joinPath(workspaceRoot, '.logex', 'session-templates');
    await vscode.workspace.fs.createDirectory(templatesDir);

    const fileUri = vscode.Uri.joinPath(templatesDir, `${id}.json`);
    // check duplicate
    try {
        await vscode.workspace.fs.stat(fileUri);
        throw new Error(`A template with id '${id}' already exists.`);
    } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith("A template")) {
            throw err;
        }
        // else doesn't exist
    }

    const templateJson = {
        name: data.name,
        description: data.description,
        parameters: data.parameters,
        sources: data.sources,
    };

    await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(JSON.stringify(templateJson, null, 2), 'utf8')
    );

    return { id, ...data };
}
