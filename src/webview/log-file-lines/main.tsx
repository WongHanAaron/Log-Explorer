import React, { StrictMode, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import type {
    HostToWebviewMessage,
    WebviewToHostMessage,
} from "../messages";

// shared UI elements
import { Input } from "../shared/components/ui/input";
import { Button } from "../shared/components/ui/button";
import { Label } from "../shared/components/ui/label";

// VS Code API

declare const acquireVsCodeApi: () => {
    postMessage(message: WebviewToHostMessage | { type: string;[key: string]: any }): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtractionKind = "prefix-suffix" | "regex";

interface TextField {
    name: string;
    extraction: {
        kind: ExtractionKind;
        prefix?: string;
        suffix?: string;
        pattern?: string;
    };
    sample?: string;
    regexResult?: { matched: boolean; groups?: Record<string, string>; errorMessage?: string };
    datetime?: string;
}

interface XmlField {
    name: string;
    xpath: string;
}

interface JsonField {
    name: string;
    jsonPath: string;
    datetime?: string;
}

// ---------------------------------------------------------------------------
// App component
// ---------------------------------------------------------------------------

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
    const validateForm = () => {
        const errs: any = {};
        if (!shortName.trim()) { errs.shortName = "Short name is required."; }
        else if (!KEBAB_RE.test(shortName.trim())) { errs.shortName = "Short name must be kebab-case."; }
        if (!label.trim()) { errs.label = "Label is required."; }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

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

    // helpers to add/remove/update fields
    const addTextField = () => {
        setTextFields(prev => [...prev, { name: "", extraction: { kind: "prefix-suffix", prefix: "" } }]);
    };
    const removeTextField = (i: number) => {
        setTextFields(prev => prev.filter((_, idx) => idx !== i));
    };
    const updateTextField = (i: number, field: Partial<TextField>) => {
        setTextFields(prev => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...field };
            return copy;
        });
    };

    const addXmlField = () => setXmlFields(prev => [...prev, { name: "", xpath: "" }]);
    const removeXmlField = (i: number) => setXmlFields(prev => prev.filter((_, idx) => idx !== i));
    const updateXmlField = (i: number, field: Partial<XmlField>) => {
        setXmlFields(prev => {
            const copy = [...prev]; copy[i] = { ...copy[i], ...field }; return copy;
        });
    };

    const addJsonField = () => setJsonFields(prev => [...prev, { name: "", jsonPath: "" }]);
    const removeJsonField = (i: number) => setJsonFields(prev => prev.filter((_, idx) => idx !== i));
    const updateJsonField = (i: number, field: Partial<JsonField>) => {
        setJsonFields(prev => {
            const copy = [...prev]; copy[i] = { ...copy[i], ...field }; return copy;
        });
    };

    const onTestRegex = (i: number) => {
        const pattern = textFields[i].extraction.pattern || "";
        const sample = textFields[i].sample || "";
        vscode.postMessage({ type: "filelog-config:test-regex", fieldIndex: i, pattern, sampleLine: sample });
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
                {isNew ? "New Log File Line Config" : `Edit: ${shortName}`}
            </h2>
            <form onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="shortName">Short Name <span className="text-destructive-foreground">*</span></Label>
                    <Input id="shortName" value={shortName} onChange={e => setShortName(e.target.value)} autoComplete="off" placeholder="e.g. nginx-combined" />
                    <span className="text-xs text-destructive-foreground">{errors.shortName}</span>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="label">Label <span className="text-destructive-foreground">*</span></Label>
                    <Input id="label" value={label} onChange={e => setLabel(e.target.value)} autoComplete="off" placeholder="e.g. Nginx Combined Format" />
                    <span className="text-xs text-destructive-foreground">{errors.label}</span>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="description">Description</Label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-[--input-border] bg-[--input-bg] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="lineType">Line Type <span className="text-destructive-foreground">*</span></Label>
                    <select id="lineType" value={lineType} onChange={e => setLineType(e.target.value as any)} className="w-full border border-[--input-border] bg-[--input-bg] px-2 py-1">
                        <option value="text">Text</option>
                        <option value="xml">XML</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                {lineType === "xml" && (
                    <div className="flex flex-col gap-1 mb-3">
                        <Label htmlFor="rootXpath">Root XPath <span className="text-destructive-foreground">*</span></Label>
                        <Input id="rootXpath" value={rootXpath} onChange={e => setRootXpath(e.target.value)} autoComplete="off" placeholder="e.g. //Event" />
                    </div>
                )}

                {/* Fields sections */}
                {lineType === "text" && (
                    <section className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span>Fields</span>
                            <Button size="sm" onClick={addTextField}>+ Add Field</Button>
                        </div>
                        {textFields.map((f, i) => (
                            <div key={i} className="border border-border rounded-sm p-2 mb-2">
                                <div className="flex gap-2 items-center mb-1">
                                    <Input placeholder="Name" value={f.name} onChange={e => updateTextField(i, { name: e.target.value })} className="flex-1" />
                                    <Button variant="secondary" size="sm" onClick={() => removeTextField(i)}>Remove</Button>
                                </div>
                                <div className="flex gap-2 mb-1">
                                    <select value={f.extraction.kind} onChange={e => updateTextField(i, { extraction: { ...f.extraction, kind: e.target.value as ExtractionKind } })} className="border border-[--input-border] bg-[--input-bg] px-2 py-1">
                                        <option value="prefix-suffix">Prefix / Suffix</option>
                                        <option value="regex">Regex</option>
                                    </select>
                                </div>
                                {f.extraction.kind === "prefix-suffix" ? (
                                    <div className="flex gap-2 mb-1">
                                        <Input placeholder="Prefix" value={f.extraction.prefix} onChange={e => updateTextField(i, { extraction: { ...f.extraction, prefix: e.target.value } })} />
                                        <Input placeholder="Suffix" value={f.extraction.suffix} onChange={e => updateTextField(i, { extraction: { ...f.extraction, suffix: e.target.value } })} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 mb-1">
                                        <Input placeholder="Pattern" value={f.extraction.pattern} onChange={e => updateTextField(i, { extraction: { ...f.extraction, pattern: e.target.value } })} />
                                        <div className="flex gap-2 items-center">
                                            <Input placeholder="Sample log line" value={f.sample} onChange={e => updateTextField(i, { sample: e.target.value })} />
                                            <Button size="sm" onClick={() => onTestRegex(i)}>Test</Button>
                                        </div>
                                        {f.regexResult && (
                                            <div className="text-xs">
                                                {f.regexResult.errorMessage && <span className="text-destructive-foreground">{f.regexResult.errorMessage}</span>}
                                                {f.regexResult.matched && <span className="text-success-foreground">Matched</span>}
                                                {!f.regexResult.matched && !f.regexResult.errorMessage && <span>No match</span>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {lineType === "xml" && (
                    <section className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span>Field Mappings</span>
                            <Button size="sm" onClick={addXmlField}>+ Add Field</Button>
                        </div>
                        {xmlFields.map((f, i) => (
                            <div key={i} className="flex gap-2 mb-1">
                                <Input placeholder="Name" value={f.name} onChange={e => updateXmlField(i, { name: e.target.value })} />
                                <Input placeholder="XPath" value={f.xpath} onChange={e => updateXmlField(i, { xpath: e.target.value })} />
                                <Button variant="secondary" size="sm" onClick={() => removeXmlField(i)}>Remove</Button>
                            </div>
                        ))}
                    </section>
                )}

                {lineType === "json" && (
                    <section className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span>Field Mappings</span>
                            <Button size="sm" onClick={addJsonField}>+ Add Field</Button>
                        </div>
                        {jsonFields.map((f, i) => (
                            <div key={i} className="flex gap-2 mb-1">
                                <Input placeholder="Name" value={f.name} onChange={e => updateJsonField(i, { name: e.target.value })} />
                                <Input placeholder="JSON Path" value={f.jsonPath} onChange={e => updateJsonField(i, { jsonPath: e.target.value })} />
                                <Button variant="secondary" size="sm" onClick={() => removeJsonField(i)}>Remove</Button>
                            </div>
                        ))}
                    </section>
                )}

                <div className="flex gap-2 mb-3">
                    <Button type="submit">Save</Button>
                    <Button variant="secondary" onClick={() => vscode.postMessage({ type: "filelog-config:cancel" })}>Cancel</Button>
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
