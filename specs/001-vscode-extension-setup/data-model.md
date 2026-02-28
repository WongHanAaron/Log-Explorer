# Data Model: VSCode Extension Project Setup with UI Components

**Feature**: 001-vscode-extension-setup  
**Date**: 2026-02-28

## Entities

### ExtensionManifest (package.json)

The declaration file describing the extension's identity and contributions.

| Field | Description | Constraints |
|-------|-------------|-------------|
| `name` | Extension identifier | Lowercase, no spaces: `logexplorer` |
| `displayName` | Human-readable name | `LogExplorer` |
| `version` | Semver version | Starts at `0.1.0` |
| `engines.vscode` | Minimum VSCode version | `^1.85.0` |
| `main` | Entry point path | `./dist/extension.js` |
| `activationEvents` | When extension activates | `onView:logexplorer.panel` |
| `contributes.viewsContainers` | Activity Bar containers | One container: `logexplorer-container` |
| `contributes.views` | Views in containers | One view: `logexplorer.panel` of type `webview` |
| `contributes.commands` | Registered commands | At least: `logexplorer.showPanel` |

### ViewContainer

A grouping in the Activity Bar that holds views.

| Field | Description | Constraints |
|-------|-------------|-------------|
| `id` | Unique container identifier | `logexplorer-container` |
| `title` | Display title | `LogExplorer` |
| `icon` | Path to Activity Bar icon | `resources/icons/logexplorer.svg` |
| `location` | Where it appears | `activitybar` |

### WebviewView

A rendered UI panel inside the view container.

| Field | Description | Constraints |
|-------|-------------|-------------|
| `id` | View identifier | `logexplorer.panel` |
| `name` | Display name in container | `Log Explorer` |
| `type` | View type | `webview` |
| `contextualTitle` | Optional subtitle | `LogExplorer` |

**Lifecycle**:
- Created when user first opens the view (clicks Activity Bar icon)
- `resolveWebviewView()` called by VSCode to populate content
- Destroyed when view is disposed (panel hidden or extension deactivated)
- State preserved via `webview.getState()` / `webview.setState()` across visibility toggles

### Command

A named action invokable via Command Palette.

| Field | Description | Constraints |
|-------|-------------|-------------|
| `command` | Command identifier | `logexplorer.showPanel` |
| `title` | Display text in palette | `LogExplorer: Show Panel` |
| `category` | Command grouping | `LogExplorer` |

### WebviewMessage

Messages exchanged between extension host and webview.

| Field | Description | Constraints |
|-------|-------------|-------------|
| `type` | Message discriminator | String enum (e.g., `'ready'`, `'update'`) |
| `payload` | Message data | JSON-serializable, typed per message type |

**Direction**: Bidirectional
- Extension → Webview: `webview.postMessage({ type, payload })`
- Webview → Extension: `vscode.postMessage({ type, payload })` via acquireVsCodeApi()

## Relationships

```
ExtensionManifest
  └── contributes
       ├── ViewContainer (1) ──── contains ──── WebviewView (1+)
       └── Command (1+)

WebviewView ←── WebviewMessage ──→ ExtensionHost
```

## Validation Rules

- `name` must be lowercase alphanumeric with hyphens only
- `version` must be valid semver
- `engines.vscode` must be `^1.85.0` or higher
- Every view `id` must be unique across the extension
- Every command `id` must be unique across the extension
- View container `icon` must reference an existing SVG file
- Webview messages must have a `type` field for discrimination

## State Transitions

### Extension Lifecycle

```
Inactive → Activating → Active → Deactivating → Inactive
```

- **Inactive**: Extension installed but not yet activated
- **Activating**: Activation event triggered, `activate()` function called
- **Active**: Extension running, UI contributions visible, commands registered
- **Deactivating**: `deactivate()` called during shutdown
- **Inactive**: Extension fully stopped

### Webview Lifecycle

```
None → Resolving → Visible → Hidden → Visible → Disposed
```

- **None**: View not yet opened by user
- **Resolving**: `resolveWebviewView()` called, HTML being set
- **Visible**: Panel displayed with content rendered
- **Hidden**: Panel still exists but not visible (user switched views)
- **Disposed**: Panel destroyed (extension deactivated or view closed)
