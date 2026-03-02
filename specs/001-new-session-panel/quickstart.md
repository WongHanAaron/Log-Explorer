# Quickstart: New Session Panel

**Feature**: `001-new-session-panel`  
**Branch**: `001-new-session-panel`  
**Created**: 2026-02-28

---

## Prerequisites

- Node.js 18+ installed
- `npm install` completed at repo root
- A workspace with `.logex/` folder (`Log Explorer: Setup New Workspace` already run)

---

## Developer Setup

```bash
# Install dependencies (if not yet done)
npm install

# Start watch mode (rebuilds on every save)
npm run watch
# Then press F5 in VS Code to launch the Extension Development Host

# Or build once
npm run build
```

---

## Running the New Session Panel

1. Open [Extension Development Host] (press **F5**)
2. Open a workspace folder that has had `Log Explorer: Setup New Workspace` run (has `.logex/`)
3. Open **Command Palette** (`Ctrl+Shift+P`) → **Log Explorer: New Session**
4. The "New Session" editor tab opens

---

## Seeding Test Data

To verify template loading and session discovery, create test fixtures:

```bash
# Create a template
mkdir -p .logex/session-templates
cat > .logex/session-templates/example-template.json << 'EOF'
{
  "name": "Example Template",
  "description": "A template for testing",
  "parameters": [
    { "name": "Environment" },
    { "name": "Service Name" }
  ],
  "sources": [
    {
      "machine": "prod-server-01",
      "location": "/var/log/app",
      "filenameFormat": "app-*.log",
      "lineFormat": "{timestamp} [{level}] {message}"
    }
  ]
}
EOF

# Create a recent session
mkdir -p .logex/sessions/my-test-session
cat > .logex/sessions/my-test-session/session.json << 'EOF'
{
  "name": "My Test Session",
  "description": "A session for verifying the Recent Sessions list",
  "templateName": "example-template",
  "parameters": { "Environment": "staging", "Service Name": "api" },
  "timeStart": "2026-02-28T09:00:00.000Z",
  "sources": []
}
EOF
```

Then open the New Session panel — the template appears in the top-left list and the session appears in the Recent Sessions list.

---

## File Map

```
src/
├── panels/editors/
│   └── NewSessionPanel.ts          ← Upgraded from stub; manages webview lifecycle & messaging
├── workspace/
│   ├── sessionTemplates.ts         ← loadTemplates(workspaceRoot): reads .logex/session-templates/
│   └── sessions.ts                 ← loadRecentSessions(), createSession(), toKebabCase()
└── webview/new-session/
    ├── main.ts                     ← Webview entry point (compiled to dist/webview/new-session.js)
    └── styles.css                  ← Panel CSS (uses VS Code CSS variables)

dist/
└── webview/
    └── new-session.js              ← Compiled webview bundle

esbuild.mjs                         ← Updated with newSessionWebviewConfig entry
```

---

## Key Interfaces (for implementers)

```typescript
// src/workspace/sessionTemplates.ts
export interface SessionTemplate {
    id: string;
    name: string;
    description: string;
    parameters: Array<{ name: string }>;
    sources: SourceEntry[];
}
export async function loadTemplates(workspaceRoot: vscode.Uri): Promise<SessionTemplate[]>

// src/workspace/sessions.ts
export interface SessionSummary {
    name: string;
    description: string;
    folderName: string;
}
export async function loadRecentSessions(workspaceRoot: vscode.Uri): Promise<SessionSummary[]>
export async function createSession(workspaceRoot: vscode.Uri, payload: NewSessionPayload): Promise<void>
export function toKebabCase(name: string): string

// Webview message types (mirrors contracts/messaging-protocol.md)
type ExtensionMessage =
    | { type: 'init'; templates: SessionTemplate[]; recentSessions: SessionSummary[] }
    | { type: 'sessionCreated'; session: SessionSummary }
    | { type: 'sessionError'; message: string }

type WebviewMessage =
    | { type: 'ready' }
    | { type: 'submitSession'; payload: NewSessionPayload }
```

---

## Verification Checklist

- [ ] `npm run build` completes with zero errors
- [ ] New Session panel opens via Command Palette
- [ ] Template list shows templates from `.logex/session-templates/`
- [ ] Searching the template list filters results in real time
- [ ] Selecting a template populates the right-side form (name, description, parameter fields, sources)
- [ ] Recent Sessions list shows sessions from `.logex/sessions/`
- [ ] Submitting the form with a valid session name creates the folder and `session.json`
- [ ] The new session immediately appears in Recent Sessions (no panel re-open needed)
- [ ] Submitting with an empty session name highlights the field and does not create files
- [ ] Panel opens cleanly with no templates and no sessions (empty-state messages shown, no crash)
