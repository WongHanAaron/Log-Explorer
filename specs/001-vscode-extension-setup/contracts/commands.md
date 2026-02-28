# Contract: Command Palette Commands

**Feature**: 001-vscode-extension-setup  
**Type**: User-Facing Commands

This contract defines the commands the extension registers and makes available via the VSCode Command Palette.

## Commands

### `logexplorer.showPanel`

| Property | Value |
|----------|-------|
| **Identifier** | `logexplorer.showPanel` |
| **Title** | `Show Panel` |
| **Category** | `LogExplorer` |
| **Palette display** | `LogExplorer: Show Panel` |

**Behavior**: Reveals the LogExplorer sidebar panel. If the panel is already visible, focuses it. If the Activity Bar container is collapsed, expands it.

**Implementation**: Calls `vscode.commands.executeCommand('logexplorer.panel.focus')` or equivalent internal view focus API.

**Preconditions**: Extension must be activated.  
**Postconditions**: LogExplorer panel is visible and focused in the sidebar.

## Naming Convention

All future commands MUST follow this pattern:

```
logexplorer.<noun>.<verb>   — for entity-specific actions
logexplorer.<verb>          — for general actions
```

Examples:
- `logexplorer.showPanel` — general action
- `logexplorer.log.filter` — entity-specific (future)
- `logexplorer.log.clear` — entity-specific (future)

## Command ID Stability

Command identifiers are part of the public API (users may bind keybindings to them). Once published, command IDs must not change without a documented migration path.
