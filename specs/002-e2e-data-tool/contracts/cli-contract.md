# CLI Contract: `tools/loggen.js`

This document specifies the behaviour of the generated test data tool.

## Usage

```bash
node tools/loggen.js <command> [options]
```

### Commands

- `generate` – create log files on the host filesystem.
  - `--config <path>`: JSON configuration file describing log schema. (Required)
  - `--output <dir>`: Directory to place generated log files (Required).
  - `--count <n>`: Number of files to create (default: 1).
  - `--format <text|es-bulk>`: Output format (default: text).

- `deploy` – copy previously-generated files into a container.
  - `--target <container>:<path>`: Destination inside container (Required).
  - `--source <dir>`: Directory containing log files (default: current dir).

- `cleanup` – remove files from a container.
  - `--target <container>:<path>`: Directory inside container to clean (Required).

- `help` – show usage information.

### Behavior

* `generate` should validate the config and error on invalid syntax or missing
  required fields.
* If output directory does not exist, it should be created.
* Filenames should include a timestamp and incremental index (e.g.
  `log-20260228-001.txt`).
* `deploy` uses `docker cp` to perform the copy; it should report failures if
  the container does not exist or is not running.
* `cleanup` should list deleted files and ignore nonexistent targets.

### Future extension

The CLI should be implemented in a modular way so additional commands such as
`upload-es` can be added later without breaking existing options.