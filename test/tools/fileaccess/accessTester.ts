#!/usr/bin/env ts-node
/*
  Lightweight command-line tool for manually exercising file access adapters.
  Usage examples (run from workspace root):

    npx ts-node test/tools/fileaccess/accessTester.ts --type=smb --share="\\SERVER\\SHARE" --username=user --password=pass read /some/path

  The script builds the appropriate config object, creates the adapter via
  the factory, and executes one of the supported operations. Output is written
  to stdout as JSON or human-readable text, and errors are logged to stderr.

  Supported commands: read, list, stat, delete
  Global options depend on adapter type; see `--help` for details.
*/

import minimist from 'minimist';
import { createFileAdapter } from '../../../services/fileaccess/factory';
import {
    FileSourceConfig,
    SmbConfig,
    SftpConfig,
    LocalConfig,
    ListDirOptions,
} from '../../../domain/config/fileaccess/types';

async function main() {
    const argv = minimist(process.argv.slice(2), {
        string: ['type', 'share', 'host', 'username', 'password', 'root', 'basePath'],
        boolean: ['recursive'],
        alias: { t: 'type' },
        default: { recursive: false },
    });

    const type = argv.type as string;
    if (!type) {
        console.error('missing --type');
        process.exit(1);
    }

    let config: FileSourceConfig;
    switch (type) {
        case 'smb':
            config = {
                type: 'smb',
                share: argv.share,
                username: argv.username,
                password: argv.password,
                domain: argv.domain,
            } as SmbConfig;
            break;
        case 'sftp':
            config = {
                type: 'sftp',
                host: argv.host,
                port: argv.port ? parseInt(argv.port, 10) : undefined,
                username: argv.username,
                password: argv.password,
                privateKey: argv.privateKey,
                root: argv.root,
            } as SftpConfig;
            break;
        case 'local':
            config = {
                type: 'local',
                basePath: argv.basePath || '.',
            } as LocalConfig;
            break;
        default:
            console.error(`unsupported type: ${type}`);
            process.exit(1);
    }

    const adapter = createFileAdapter(config);

    const cmd = argv._[0];
    const pathArg = argv._[1];
    try {
        switch (cmd) {
            case 'read': {
                if (!pathArg) throw new Error('missing path');
                const buf = await adapter.readFile(pathArg);
                process.stdout.write(buf.toString());
                break;
            }
            case 'list': {
                const opts: ListDirOptions = { recursive: argv.recursive, maxDepth: argv.maxDepth };
                const list = await adapter.listDir(pathArg || '', opts);
                console.log(JSON.stringify(list, null, 2));
                break;
            }
            case 'stat': {
                const stat = await adapter.stat?.(pathArg || '');
                console.log(JSON.stringify(stat, null, 2));
                break;
            }
            case 'delete': {
                await adapter.delete?.(pathArg || '');
                console.log('deleted');
                break;
            }
            default:
                console.error('unknown command');
                process.exit(1);
        }
    } catch (err: any) {
        console.error('error:', err.message || err);
        process.exit(2);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
