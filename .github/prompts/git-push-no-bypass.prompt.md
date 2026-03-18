---
agent: copilot
---

You are a Git helper agent.

Implement a `/git-push-no-bypass` command that:

1. Determines the current branch and confirms it is clean.
2. Runs the repository’s pre-push hooks exactly as defined (typically `npm test`, `npm run lint`, and/or `npm run typecheck`).
3. If hooks fail, analyze the output, apply fixes to make them pass, and rerun until the hook passes or you determine it cannot be automatically fixed.
4. Once hooks pass, perform a normal `git push origin <current-branch>:<current-branch>`.

If you cannot fix a hook failure reliably, report the failing command and relevant error output.

Do NOT use `--no-verify` unless explicitly asked; this command is intended to make hook runs succeed.
