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
    // list pane state
    const [names, setNames] = useState<string[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedName, setSelectedName] = useState<string | null>(null);

    const [shortName, setShortName] = useState("");
    const [pathPattern, setPathPattern] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [isNew, setIsNew] = useState(true);
    const [originalShortName, setOriginalShortName] = useState<string | null>(null);
    const [errors, setErrors] = useState({ shortName: "", pathPattern: "" });
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);
    const [nameAvailable, setNameAvailable] = useState(true);
    const [savedConfig, setSavedConfig] = useState<{
        shortName: string;
        pathPattern: string;
        description: string;
        tags: string[];
    } | null>(null);
    const [canSave, setCanSave] = useState(false);

    // track debounce timer for search
    const searchTimer = React.useRef<number | null>(null);

    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    useEffect(() => {
        function handler(event: MessageEvent) {
            const msg = event.data as HostToWebviewMessage;
            switch (msg.type) {
                case "init": {
                    setNames(msg.configs);
                    if (msg.current) {
                        const cfg = msg.current;
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
                        setSelectedName(cfg.shortName);
                        setIsNew(false);
                    } else {
                        // clear selection/form
                        setShortName("");
                        setPathPattern("");
                        setDescription("");
                        setTags([]);
                        setOriginalShortName(null);
                        setSavedConfig(null);
                        setSelectedName(null);
                        setIsNew(true);
                    }
                    break;
                }
                case "configListChanged": {
                    setNames(msg.configs);
                    // if selected name was removed, clear selection
                    if (selectedName && !msg.configs.includes(selectedName)) {
                        setSelectedName(null);
                        setShortName("");
                        setPathPattern("");
                        setDescription("");
                        setTags([]);
                        setOriginalShortName(null);
                        setSavedConfig(null);
                        setIsNew(true);
                    }
                    break;
                }
                case "configData": {
                    const cfg = msg.config;
                    if (cfg) {
                        setSelectedName(cfg.shortName);
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
                        setIsNew(false);
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
    }, [isNew, shortName, selectedName]);

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

    const onNameClick = (name: string) => {
        setSelectedName(name);
        vscode.postMessage({ type: 'selectConfig', name });
    };

    const filteredNames = names.filter(n => n.toLowerCase().includes(searchText.toLowerCase()));

    return (
        <div className="flex h-full">
            {/* left list pane */}
            <div className="w-1/3 min-w-[150px] max-w-[300px] border-r border-[--border] p-2 overflow-auto">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchText}
                    onChange={e => {
                        const v = e.target.value;
                        setSearchText(v);
                        if (searchTimer.current !== null) {
                            clearTimeout(searchTimer.current);
                        }
                        searchTimer.current = window.setTimeout(() => {
                            setSearchText(v);
                        }, 200);
                    }}
                    className="w-full mb-2 px-2 py-1 border border-[--input-border] rounded"
                />
                {filteredNames.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No configs found.</div>
                ) : (
                    <ul
                        className="list-none p-0 m-0"
                        tabIndex={0}
                        onKeyDown={e => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (filteredNames.length === 0) return;
                                const idx = filteredNames.findIndex(x => x === selectedName);
                                let next = 0;
                                if (idx !== -1) {
                                    if (e.key === 'ArrowDown') {
                                        next = (idx + 1) % filteredNames.length;
                                    } else {
                                        next = (idx - 1 + filteredNames.length) % filteredNames.length;
                                    }
                                }
                                const name = filteredNames[next];
                                setSelectedName(name);
                                vscode.postMessage({ type: 'selectConfig', name });
                            } else if (e.key === 'Enter' && selectedName) {
                                vscode.postMessage({ type: 'selectConfig', name: selectedName });
                            }
                        }}
                    >
                        {filteredNames.map(n => (
                            <li
                                key={n}
                                className={`px-2 py-1 cursor-pointer ${n === selectedName ? 'bg-[--list-activeSelectionBackground]' : ''}`}
                                onClick={() => onNameClick(n)}
                            >
                                {n}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* right form pane */}
            <div className="flex-1 min-w-0 overflow-auto">
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
            </div>
        </div>
    );
}
