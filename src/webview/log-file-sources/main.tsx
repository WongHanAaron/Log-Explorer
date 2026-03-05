import React, { StrictMode, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import type {
    HostToWebviewMessage,
    WebviewToHostMessage,
} from "../messages";

// shared UI components provide consistent VS Code theming
import { Input } from "../shared/components/ui/input";
import { Button } from "../shared/components/ui/button";
import { Label } from "../shared/components/ui/label";

// Acquire VS Code API provided in webview context

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string;[key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

function App() {
    const [shortName, setShortName] = useState("");
    const [label, setLabel] = useState("");
    const [pathPattern, setPathPattern] = useState("");
    const [description, setDescription] = useState("");

    const [isNew, setIsNew] = useState(true);
    const [originalShortName, setOriginalShortName] = useState<string | null>(null);
    const [errors, setErrors] = useState({ shortName: "", label: "", pathPattern: "" });
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);

    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    // message handler
    useEffect(() => {
        function handler(event: MessageEvent) {
            const msg = event.data as HostToWebviewMessage;
            switch (msg.type) {
                case "filepath-config:load": {
                    const cfg = msg.config;
                    setIsNew(msg.isNew);
                    if (cfg) {
                        setShortName(cfg.shortName);
                        setLabel(cfg.label);
                        setPathPattern(cfg.pathPattern);
                        setDescription(cfg.description ?? "");
                        setOriginalShortName(cfg.shortName);
                    }
                    break;
                }
                case "filepath-config:name-available": {
                    if (!msg.available) {
                        setErrors(prev => ({ ...prev, shortName: "A config with this name already exists." }));
                    }
                    break;
                }
                case "filepath-config:save-result": {
                    if (msg.success) {
                        setStatus({ text: "Saved successfully.", kind: "success" });
                        if (isNew) {
                            setIsNew(false);
                            setOriginalShortName(shortName);
                        }
                    } else {
                        setStatus({ text: `Error: ${msg.errorMessage ?? "Save failed."}`, kind: "error" });
                    }
                    break;
                }
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [isNew, shortName]);

    // send ready notification once
    useEffect(() => {
        vscode.postMessage({ type: "ready" });
    }, []);

    const validateForm = useCallback(() => {
        let valid = true;
        const errs = { shortName: "", label: "", pathPattern: "" };
        if (!shortName.trim()) {
            errs.shortName = "Short name is required.";
            valid = false;
        } else if (!KEBAB_RE.test(shortName.trim())) {
            errs.shortName = "Short name must be kebab-case (lowercase letters, digits, hyphens).";
            valid = false;
        }
        if (!label.trim()) {
            errs.label = "Label is required.";
            valid = false;
        }
        if (!pathPattern.trim()) {
            errs.pathPattern = "Path / glob pattern is required.";
            valid = false;
        }
        setErrors(errs);
        return valid;
    }, [shortName, label, pathPattern]);

    const onShortNameBlur = () => {
        const name = shortName.trim();
        if (!name || !KEBAB_RE.test(name)) return;
        if (isNew || name !== originalShortName) {
            vscode.postMessage({ type: "filepath-config:validate-name", shortName: name });
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setStatus({ text: "Saving…", kind: "info" });
        vscode.postMessage({
            type: "filepath-config:save",
            config: {
                shortName: shortName.trim(),
                label: label.trim(),
                pathPattern: pathPattern.trim(),
                ...(description.trim() ? { description: description.trim() } : {}),
            },
        });
    };

    const onCancel = () => {
        vscode.postMessage({ type: "filepath-config:cancel" });
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
                {isNew ? "New Filepath Config" : `Edit: ${originalShortName}`}
            </h2>
            <form onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="shortName" className="flex items-center gap-1">
                        Short Name <span className="text-destructive-foreground">*</span>
                    </Label>
                    <Input
                        id="shortName"
                        value={shortName}
                        onChange={e => setShortName(e.target.value)}
                        onBlur={onShortNameBlur}
                        readOnly={!isNew}
                        autoComplete="off"
                        placeholder="e.g. nginx-access"
                        className={!shortName.trim() && errors.shortName ? "ring-1 ring-destructive-foreground" : ""}
                    />
                    <span className="text-xs text-destructive-foreground">{errors.shortName}</span>
                    <span className="text-xs text-muted-foreground italic">Kebab-case identifier — used as the filename</span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="label" className="flex items-center gap-1">
                        Label <span className="text-destructive-foreground">*</span>
                    </Label>
                    <Input
                        id="label"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        autoComplete="off"
                        placeholder="e.g. Nginx Access Log"
                    />
                    <span className="text-xs text-destructive-foreground">{errors.label}</span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="pathPattern" className="flex items-center gap-1">
                        Path / Glob Pattern <span className="text-destructive-foreground">*</span>
                    </Label>
                    <Input
                        id="pathPattern"
                        value={pathPattern}
                        onChange={e => setPathPattern(e.target.value)}
                        autoComplete="off"
                        placeholder="e.g. /var/log/nginx/access.log or logs/**/*.log"
                    />
                    <span className="text-xs text-destructive-foreground">{errors.pathPattern}</span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Optional notes about this log source"
                        className="w-full border border-[--input-border] bg-[--input-bg] px-2 py-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                <div className="flex gap-2 mb-3">
                    <Button type="submit" variant="default" size="default">
                        Save
                    </Button>
                    <Button type="button" variant="secondary" size="default" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>

                {status && (
                    <div className={`text-xs ${status.kind === 'success' ? 'text-terminal-ansiGreen' : status.kind === 'error' ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>{status.text}</div>
                )}
            </form>
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
