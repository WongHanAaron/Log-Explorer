import React, { useState, useEffect, useCallback } from "react";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../messages";
import { FormPage, TextField, XmlField, JsonField } from "./components/FormPage";
import type { FileLogLineConfigPayload } from "./models";

// helper that mirrors the logic used by `save` within <App />.  Having a
// standalone, exported function makes it easy to unit‑test the shape and keeps
// the payload construction aligned with our TypeScript data model.
export function buildPayload(
    lineType: "text" | "xml" | "json",
    shortName: string,
    description: string,
    tags: string[],
    fields: TextField[],
    xmlFields: XmlField[],
    jsonFields: JsonField[]
): FileLogLineConfigPayload {
    const base = {
        type: lineType,
        shortName: shortName.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(tags.length ? { tags } : {}),
    };

    switch (lineType) {
        case "text":
            return {
                ...base,
                type: "text",
                fields,
            };
        case "xml":
            return {
                ...base,
                type: "xml",
                fields: xmlFields,
            };
        case "json":
            return {
                ...base,
                type: "json",
                fields: jsonFields,
            };
        default:
            throw new Error(`unexpected lineType ${lineType}`);
    }
}

// VS Code API helper available in webview context

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string;[key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

export function App() {
    const [shortName, setShortName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [lineType, setLineType] = useState<"text" | "xml" | "json">("text");
    // rootXpath was removed from the model; extraction will always start
    // at document root so we don't need a separate field.

    const [fields, setFields] = useState<TextField[]>([]);
    const [xmlFields, setXmlFields] = useState<XmlField[]>([]);
    const [jsonFields, setJsonFields] = useState<JsonField[]>([]);

    const [isNew, setIsNew] = useState(true);
    const [errors, setErrors] = useState<{ shortName?: string }>({});
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);
    // explicit save flow eliminates need for suppression/submit logic

    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    // message handler
    useEffect(() => {
        const handler = (evt: MessageEvent) => {
            const msg = evt.data as HostToWebviewMessage;
            switch (msg.type) {
                case "filelog-config:load": {
                    const cfg = msg.config as any; // loose
                    setIsNew(msg.isNew);
                    if (cfg) {
                        setShortName(cfg.shortName);
                        // label is stored but not editable
                        setDescription(cfg.description || "");
                        setTags(cfg.tags || []);
                        setLineType(cfg.type || "text");
                        // payload now uses a single `fields` array which is interpreted
                        // as text/xml/json based on the type.
                        setFields(cfg.type === 'text' ? cfg.fields || [] : []);
                        setXmlFields(cfg.type === 'xml' ? cfg.fields || [] : []);
                        setJsonFields(cfg.type === 'json' ? cfg.fields || [] : []);
                    } else {
                        // clear
                        setShortName(""); setDescription(""); setTags([]);
                        setLineType("text"); setFields([]); setXmlFields([]); setJsonFields([]);
                    }
                    break;
                }
                case "filelog-config:name-available": {
                    if (!msg.available) {
                        setErrors(prev => ({ ...prev, shortName: "A config with this name already exists." }));
                    }
                    break;
                }
                case "filelog-config:save-result": {
                    if (msg.success) {
                        setStatus({ text: "Saved successfully.", kind: "success" });
                        if (isNew) setIsNew(false);
                    } else {
                        setStatus({ text: `Error: ${msg.errorMessage ?? "Save failed."}`, kind: "error" });
                    }
                    break;
                }
                case "filelog-config:regex-test-result": {
                    const idx = msg.fieldIndex;
                    setFields(prev => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], regexResult: { matched: msg.matched, groups: msg.groups, errorMessage: msg.errorMessage } };
                        return copy;
                    });
                    break;
                }
            }
        };
        window.addEventListener("message", handler);
        vscode.postMessage({ type: "ready" });
        return () => window.removeEventListener("message", handler);
    }, [isNew]);

    // validation
    const validateForm = useCallback(() => {
        const errs: any = {};
        if (!shortName.trim()) { errs.shortName = "Short name is required."; }
        else if (!KEBAB_RE.test(shortName.trim())) { errs.shortName = "Short name must be kebab-case."; }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [shortName]);

    const save = () => {
        setStatus(null);
        if (!validateForm()) return;
        const payload = buildPayload(lineType, shortName, description, tags, fields, xmlFields, jsonFields);
        vscode.postMessage({ type: "filelog-config:save", config: payload });
    };

    // helpers to manage fields (can be passed down or kept here)
    const handleAddTag = (tag: string) => {
        console.log('App.handleAddTag invoked with', tag);
        setTags(prev => {
            const next = [...prev, tag];
            console.log('App.tags will become', next);
            return next;
        });
    };

    // no longer needed, saving occurs directly in `save`

    return (
        <FormPage
            shortName={shortName}
            setShortName={setShortName}
            description={description}
            setDescription={setDescription}
            tags={tags}
            onAddTag={handleAddTag}
            onRenameTag={(i, tag) => setTags(prev => {
                const copy = [...prev];
                copy[i] = tag;
                return copy;
            })}
            onRemoveTag={i => setTags(prev => prev.filter((_, idx) => idx !== i))}
            lineType={lineType}
            setLineType={setLineType}
            fields={fields}
            setFields={setFields}
            xmlFields={xmlFields}
            setXmlFields={setXmlFields}
            jsonFields={jsonFields}
            setJsonFields={setJsonFields}
            isNew={isNew}
            errors={errors}
            status={status}
            onCancel={() => vscode.postMessage({ type: "filelog-config:cancel" })}
            onSave={save}
            onTestRegex={(i: number) => vscode.postMessage({ type: "filelog-config:test-regex", fieldIndex: i, pattern: fields[i].extraction.pattern || "", sampleLine: fields[i].sample || "" })}
        />
    );
}
