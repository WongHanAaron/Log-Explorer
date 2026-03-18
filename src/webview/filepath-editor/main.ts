// Webview script for the Log Filepath Config Editor.
// Runs in the VS Code webview sandbox (browser context — no Node.js APIs).

declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscodeApi = acquireVsCodeApi();

// ── DOM refs ──────────────────────────────────────────────────────────────────

const form = document.getElementById('config-form') as HTMLFormElement;
const pageTitle = document.getElementById('page-title') as HTMLHeadingElement;
const shortNameInput = document.getElementById('shortName') as HTMLInputElement;
const labelInput = document.getElementById('label') as HTMLInputElement;
const pathPatternInput = document.getElementById('pathPattern') as HTMLInputElement;
const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;

const shortNameError = document.getElementById('shortName-error') as HTMLSpanElement;
const labelError = document.getElementById('label-error') as HTMLSpanElement;
const pathPatternError = document.getElementById('pathPattern-error') as HTMLSpanElement;

// ── State ─────────────────────────────────────────────────────────────────────

let isNew = true;
let originalShortName: string | null = null;
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ── Validation ────────────────────────────────────────────────────────────────

function clearErrors(): void {
    shortNameError.textContent = '';
    labelError.textContent = '';
    pathPatternError.textContent = '';
}

function validateForm(): boolean {
    clearErrors();
    let valid = true;

    const name = shortNameInput.value.trim();
    if (!name) {
        shortNameError.textContent = 'Short name is required.';
        valid = false;
    } else if (!KEBAB_RE.test(name)) {
        shortNameError.textContent = 'Short name must be kebab-case (lowercase letters, digits, hyphens).';
        valid = false;
    }

    if (!labelInput.value.trim()) {
        labelError.textContent = 'Label is required.';
        valid = false;
    }

    if (!pathPatternInput.value.trim()) {
        pathPatternError.textContent = 'Path / glob pattern is required.';
        valid = false;
    }

    return valid;
}

// ── Event: short-name blur — validate uniqueness on host side ─────────────────

shortNameInput.addEventListener('blur', () => {
    const name = shortNameInput.value.trim();
    if (!name || !KEBAB_RE.test(name)) {
        return;
    }
    // Only check availability when creating a new config or when the name changed.
    if (isNew || name !== originalShortName) {
        vscodeApi.postMessage({ type: 'filepath-config:validate-name', shortName: name });
    }
});

// ── Event: form submit ─────────────────────────────────────────────────────────

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }
    saveBtn.disabled = true;
    setStatus('Saving…', 'info');

    vscodeApi.postMessage({
        type: 'filepath-config:save',
        config: {
            shortName: shortNameInput.value.trim(),
            label: labelInput.value.trim(),
            pathPattern: pathPatternInput.value.trim(),
            ...(descriptionInput.value.trim() ? { description: descriptionInput.value.trim() } : {})
        }
    });
});

// ── Event: cancel ──────────────────────────────────────────────────────────────

cancelBtn.addEventListener('click', () => {
    // Ask host to close the panel by posting a cancel message.
    // (The panel can just dispose itself.)
    vscodeApi.postMessage({ type: 'filepath-config:cancel' });
});

// ── Host messages ─────────────────────────────────────────────────────────────

window.addEventListener('message', (event) => {
    const msg = event.data as { type: string;[key: string]: unknown };

    switch (msg.type) {
        case 'filepath-config:load': {
            const config = msg.config as {
                shortName: string; label: string; pathPattern: string; description?: string;
            } | null;
            isNew = msg.isNew as boolean;

            if (config) {
                shortNameInput.value = config.shortName;
                labelInput.value = config.label;
                pathPatternInput.value = config.pathPattern;
                descriptionInput.value = config.description ?? '';
                originalShortName = config.shortName;
                pageTitle.textContent = `Edit: ${config.shortName}`;
                shortNameInput.readOnly = true; // prevent rename — delete and recreate
            } else {
                pageTitle.textContent = 'New Filepath Config';
            }
            break;
        }

        case 'filepath-config:name-available': {
            const available = msg.available as boolean;
            if (!available) {
                shortNameError.textContent = 'A config with this name already exists.';
                saveBtn.disabled = false;
            }
            break;
        }

        case 'filepath-config:save-result': {
            saveBtn.disabled = false;
            if (msg.success) {
                setStatus('Saved successfully.', 'success');
                if (isNew) {
                    // Update state to reflect editing mode.
                    isNew = false;
                    originalShortName = shortNameInput.value.trim();
                    pageTitle.textContent = `Edit: ${originalShortName}`;
                    shortNameInput.readOnly = true;
                }
            } else {
                setStatus(`Error: ${msg.errorMessage ?? 'Save failed.'}`, 'error');
            }
            break;
        }
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setStatus(text: string, kind: 'info' | 'success' | 'error'): void {
    statusBar.textContent = text;
    statusBar.className = `status ${kind}`;
}
