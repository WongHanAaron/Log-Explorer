// compile-time-only type

type ListDirOptions = import('../../domain/config/fileaccess/types.ts').ListDirOptions;


/**
 * Walk a generic directory client that has `readdir` and returns entries with
 * `name` and `type` or requires `stat` to differentiate directories.
 */
export async function walkDir(
    readdir: (path: string) => Promise<any[]>,
    stat: (path: string) => Promise<{ isDirectory: boolean }>,
    path: string,
    options: ListDirOptions = {},
    depth = 0,
    output: string[] = []
): Promise<string[]> {
    if (options.maxDepth !== undefined && depth > options.maxDepth) {
        return output;
    }

    const entries = await readdir(path);
    const basePath = path.replace(/\\/g, '/').replace(/^\.\/?/, '');
    for (const entry of entries) {
        const name = entry.name || entry.filename || entry;
        const full = basePath ? `${basePath}/${name}` : `${name}`;
        let isDir = false;
        if (typeof entry.isDirectory === 'function') {
            isDir = entry.isDirectory();
        } else if (entry.type === 'd' || entry.type === 'directory') {
            isDir = true;
        } else {
            // fallback to stat
            const s = await stat(full);
            isDir = s.isDirectory;
        }

        if (isDir) {
            if (options.recursive) {
                output.push(full);
                await walkDir(readdir, stat, full, options, depth + 1, output);
            } else {
                output.push(full);
            }
        } else {
            output.push(full);
        }
    }
    return output;
}
