import React, { useState, useEffect, useCallback } from "react";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../messages";
import { FormPage, TextField, XmlField, JsonField } from "./components/FormPage";

// VS Code API helper available in webview context

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string;[key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

export function App() {
    const [shortName, setShortName] = useState("");
    const [label, setLabel] = useState("");
    const [description, setDescription] = useState("");
    const [lineType, setLineType] = useState<"text" | "xml" | "json">("text");
    const [rootXpath, setRootXpath] = useState("");

    const [textFields, setTextFields] = useState<TextField[]>([]);
    const [xmlFields, setXmlFields] = useState<XmlField[]>([]);
    const [jsonFields, setJsonFields] = useState<JsonField[]>([]);

    const [isNew, setIsNew] = useState(true);
    const [errors, setErrors] = useState<{ shortName?: string; label?: string }>({});
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);

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
                        setLabel(cfg.label);
                        setDescription(cfg.description || "");
                        setLineType(cfg.type || "text");
                        setTextFields(cfg.textFields || []);
                        setXmlFields(cfg.xmlFields || []);
                        setJsonFields(cfg.jsonFields || []);
                        setRootXpath(cfg.rootXpath || "");
                    } else {
                        // clear
                        setShortName(""); setLabel(""); setDescription("");
                        setLineType("text"); setTextFields([]); setXmlFields([]); setJsonFields([]); setRootXpath("");
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
                    setTextFields(prev => {
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
        if (!label.trim()) { errs.label = "Label is required."; }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [shortName, label]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        if (!validateForm()) return;
        const payload: any = {
            type: lineType,
            shortName: shortName.trim(),
            label: label.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
        };
        if (lineType === "xml") payload.rootXpath = rootXpath;
        if (textFields.length) payload.textFields = textFields;
        if (xmlFields.length) payload.xmlFields = xmlFields;
        if (jsonFields.length) payload.jsonFields = jsonFields;
        vscode.postMessage({ type: "filelog-config:save", config: payload });
    };

    // helpers to manage fields (can be passed down or kept here)

    return (
        <FormPage
            shortName={shortName}
            setShortName={setShortName}
            label={label}
            setLabel={setLabel}
            description={description}
            setDescription={setDescription}
            lineType={lineType}
            setLineType={setLineType}
            rootXpath={rootXpath}
            setRootXpath={setRootXpath}
            textFields={textFields}
            setTextFields={setTextFields}
            xmlFields={xmlFields}
            setXmlFields={setXmlFields}
            jsonFields={jsonFields}
            setJsonFields={setJsonFields}
            isNew={isNew}
            errors={errors}
            status={status}
            onSubmit={onSubmit}
            onCancel={() => vscode.postMessage({ type: "filelog-config:cancel" })}
            validateForm={validateForm}
            onTestRegex={(i: number) => vscode.postMessage({ type: "filelog-config:test-regex", fieldIndex: i, pattern: textFields[i].extraction.pattern || "", sampleLine: textFields[i].sample || "" })}
        />
    );
}
