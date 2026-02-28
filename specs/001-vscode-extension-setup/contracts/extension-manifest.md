# Contract: Extension Manifest (package.json contributions)

**Feature**: 001-vscode-extension-setup  
**Type**: VSCode Extension Manifest

This contract defines the public interface the extension exposes to VSCode through `package.json` contributions. Users and VSCode itself interact with the extension through these declared contributions.

## View Container Contribution

```jsonc
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "logexplorer-container",
          "title": "LogExplorer",
          "icon": "resources/icons/logexplorer.svg"
        }
      ]
    }
  }
}
```

**Contract**:
- One Activity Bar icon labeled "LogExplorer"
- Icon must be a monochrome SVG that respects VSCode theming
- Container `id` is stable and must not change across versions

## Views Contribution

```jsonc
{
  "contributes": {
    "views": {
      "logexplorer-container": [
        {
          "type": "webview",
          "id": "logexplorer.panel",
          "name": "Log Explorer"
        }
      ]
    }
  }
}
```

**Contract**:
- One webview view inside the LogExplorer container
- View `id` (`logexplorer.panel`) is the stable identifier used in activation events and provider registration
- View `name` is user-facing and may change for branding purposes

## Commands Contribution

```jsonc
{
  "contributes": {
    "commands": [
      {
        "command": "logexplorer.showPanel",
        "title": "Show Panel",
        "category": "LogExplorer"
      }
    ]
  }
}
```

**Contract**:
- Commands appear in Command Palette with `LogExplorer:` prefix
- Command identifiers follow pattern `logexplorer.<action>`
- Command `logexplorer.showPanel` reveals the LogExplorer sidebar panel

## Activation Events

```jsonc
{
  "activationEvents": []
}
```

**Contract**:
- Extension activates when the webview view is opened (`onView:logexplorer.panel`)
- Since VSCode automatically generates `onView` activation events from declared views, the `activationEvents` array can be left empty (implicit activation)
- Extension must not activate eagerly (`*`) to minimize startup impact
