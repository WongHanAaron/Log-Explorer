import React, { useState, useEffect, useCallback } from "react";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../messages";
import { FormPage } from "./components/FormPage";

// VS Code API helper made available inside webview context

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string; [key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

export function App() {
    const [shortName, setShortName] = useState("");
    const [label, setLabel] = useState("");
    const [pathPattern, setPathPattern] = useState("");
    const [description, setDescription] = useState("");

    const [isNew, setIsNew] = useState(true);
    const [originalShortName, setOriginalShortName] = useState<string | null>(null);
    const [errors, setErrors] = useState({ shortName: "", label: "", pathPattern: "" });
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);

    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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
        <FormPage
            shortName={shortName}
            setShortName={setShortName}
            label={label}
            setLabel={setLabel}
            pathPattern={pathPattern}
            setPathPattern={setPathPattern}
            description={description}
            setDescription={setDescription}
            isNew={isNew}
            errors={errors}
            status={status}
            validateForm={validateForm}
            onShortNameBlur={onShortNameBlur}
            onSubmit={onSubmit}
            onCancel={onCancel}
            originalShortName={originalShortName}
        />
    );
}
