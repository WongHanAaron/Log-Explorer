import React, { useState, useEffect, useCallback } from "react";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../messages";
import { FormPage } from "./components/FormPage";

// VS Code API helper made available inside webview context

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string;[key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

export function App() {
    const [shortName, setShortName] = useState("");
    const [pathPattern, setPathPattern] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [isNew, setIsNew] = useState(true);
    const [originalShortName, setOriginalShortName] = useState<string | null>(null);
    const [errors, setErrors] = useState({ shortName: "", pathPattern: "" });
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);
    const [nameAvailable, setNameAvailable] = useState(true);
    // snapshot of the last successfully saved values.  We keep this so we can
    // detect whether the form is "dirty" (i.e. user made changes after the last
    // save) and therefore control the visibility of the Save button.
    const [savedConfig, setSavedConfig] = useState<{
        shortName: string;
        pathPattern: string;
        description: string;
        tags: string[];
    } | null>(null);
    // derived boolean computed in an effect below.  `canSave` is true when the
    // current form passes basic validation and differs from `savedConfig`.  It's
    // passed to <FormPage> which simply renders the Save button when truthy.
    const [canSave, setCanSave] = useState(false);
    // we no longer use the old form-based submit flow; saving is triggered
    // explicitly by clicking the Save button.  This lets us drop the
    // suppression logic that prevented tag-enter from firing a save.

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
                        setPathPattern(cfg.pathPattern);
                        setDescription(cfg.description ?? "");
                        setTags(cfg.tags || []);
                        setOriginalShortName(cfg.shortName);
                        setSavedConfig({
                            shortName: cfg.shortName,
                            pathPattern: cfg.pathPattern,
                            description: cfg.description ?? "",
                            tags: cfg.tags || [],
                        });
                    } else {
                        setShortName("");
                        setPathPattern("");
                        setDescription("");
                        setTags([]);
                        setOriginalShortName(null);
                        setSavedConfig(null);
                    }
                    break;
                }
                case "filepath-config:name-available": {
                    setNameAvailable(msg.available);
                    if (!msg.available && (isNew || shortName.trim() !== originalShortName)) {
                        setStatus({ text: "A configuration with that name already exists. Saving will overwrite.", kind: "info" });
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
                        // mark current state as saved
                        setSavedConfig({
                            shortName: shortName.trim(),
                            pathPattern: pathPattern.trim(),
                            description: description.trim(),
                            tags,
                        });
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

    const validateForm = useCallback(() => {
        let valid = true;
        const errs = { shortName: "", pathPattern: "" };
        if (!shortName.trim()) {
            errs.shortName = "Short name is required.";
            valid = false;
        } else if (!KEBAB_RE.test(shortName.trim())) {
            errs.shortName = "Short name must be kebab-case (lowercase letters, digits, hyphens).";
            valid = false;
        }
        if (!pathPattern.trim()) {
            errs.pathPattern = "Path / glob pattern is required.";
            valid = false;
        }
        setErrors(errs);
        return valid;
    }, [shortName, pathPattern]);

    // whenever form fields or savedConfig change, re-run validation and dirty check
    useEffect(() => {
        const valid = validateForm();
        const trimmed = {
            shortName: shortName.trim(),
            pathPattern: pathPattern.trim(),
            description: description.trim(),
            tags,
        };
        const dirty = !savedConfig ||
            savedConfig.shortName !== trimmed.shortName ||
            savedConfig.pathPattern !== trimmed.pathPattern ||
            savedConfig.description !== trimmed.description ||
            savedConfig.tags.length !== trimmed.tags.length ||
            savedConfig.tags.some((t, i) => t !== trimmed.tags[i]);
        setCanSave(valid && dirty);
    }, [shortName, pathPattern, description, tags, savedConfig, validateForm]);

    useEffect(() => {
        vscode.postMessage({ type: "ready" });
    }, []);

    const onShortNameBlur = () => {
        const name = shortName.trim();
        if (!name || !KEBAB_RE.test(name)) return;
        if (isNew || name !== originalShortName) {
            vscode.postMessage({ type: "filepath-config:validate-name", shortName: name });
        }
    };

    const save = () => {
        setStatus(null);
        if (!validateForm()) return;
        const name = shortName.trim();
        if (!nameAvailable && (isNew || name !== originalShortName)) {
            const proceed = window.confirm(
                "A configuration with that name already exists. Do you want to overwrite it?"
            );
            if (!proceed) return;
        }
        setStatus({ text: "Saving…", kind: "info" });
        vscode.postMessage({
            type: "filepath-config:save",
            config: {
                shortName: name,
                pathPattern: pathPattern.trim(),
                ...(description.trim() ? { description: description.trim() } : {}),
                tags,
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
            pathPattern={pathPattern}
            setPathPattern={setPathPattern}
            description={description}
            setDescription={setDescription}
            tags={tags}
            onAddTag={tag => setTags(prev => [...prev, tag])}
            onRenameTag={(i, tag) => setTags(prev => {
                const copy = [...prev];
                copy[i] = tag;
                return copy;
            })}
            onRemoveTag={i => setTags(prev => prev.filter((_, idx) => idx !== i))}
            isNew={isNew}
            errors={errors}
            status={status}
            onShortNameBlur={onShortNameBlur}
            onSave={save}
            onCancel={onCancel}
            originalShortName={originalShortName}
            canSave={canSave}
        />
    );
}
