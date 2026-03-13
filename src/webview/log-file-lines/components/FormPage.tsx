import React from "react";
import { Input } from "../../shared/components/ui/input";
import { Button } from "../../shared/components/ui/button";
import { Label } from "../../shared/components/ui/label";
import { TagSet } from "../../shared/components/tag/TagSet";

export type ExtractionKind = "prefix-suffix" | "regex";
export interface TextField {
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

export interface XmlField {
    name: string;
    xpath: string;
}

export interface JsonField {
    name: string;
    jsonPath: string;
    datetime?: string;
}

export interface FormPageProps {
    shortName: string;
    setShortName: (s: string) => void;
    // label removed from UI; kept internally by host if needed
    description: string;
    setDescription: (s: string) => void;
    tags: string[];
    onAddTag: (tag: string) => void;
    onRenameTag: (index: number, tag: string) => void;
    onRemoveTag: (index: number) => void;
    lineType: "text" | "xml" | "json";
    setLineType: (v: "text" | "xml" | "json") => void;
    fields: TextField[];
    setFields: React.Dispatch<React.SetStateAction<TextField[]>>;
    xmlFields: XmlField[];
    setXmlFields: React.Dispatch<React.SetStateAction<XmlField[]>>;
    jsonFields: JsonField[];
    setJsonFields: React.Dispatch<React.SetStateAction<JsonField[]>>;
    isNew: boolean;
    errors: { shortName?: string };
    status: { text: string; kind: "info" | "success" | "error" } | null;
    onCancel: () => void;
    onTestRegex: (index: number) => void;
    /** fired when user clicks Save */
    onSave: () => void;
}

export function FormPage({
    shortName,
    setShortName,
    description,
    setDescription,
    tags,
    onAddTag,
    onRenameTag,
    onRemoveTag,
    lineType,
    setLineType,
    fields,
    setFields,
    xmlFields,
    setXmlFields,
    jsonFields,
    setJsonFields,
    isNew,
    errors,
    status,
    onCancel,
    onTestRegex,
    onSave,
}: FormPageProps) {
    // helper functions for field manipulation
    const addField = () => {
        setFields((prev: TextField[]) => [...prev, { name: "", extraction: { kind: "prefix-suffix", prefix: "" } }]);
    };
    const removeField = (i: number) => {
        setFields((prev: TextField[]) => prev.filter((_, idx) => idx !== i));
    };
    const updateField = (i: number, field: Partial<TextField>) => {
        setFields((prev: TextField[]) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...field };
            return copy;
        });
    };

    const addXmlField = () => setXmlFields((prev: XmlField[]) => [...prev, { name: "", xpath: "" }]);
    const removeXmlField = (i: number) => setXmlFields((prev: XmlField[]) => prev.filter((_, idx) => idx !== i));
    const updateXmlField = (i: number, field: Partial<XmlField>) => {
        setXmlFields((prev: XmlField[]) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...field };
            return copy;
        });
    };

    const addJsonField = () => setJsonFields((prev: JsonField[]) => [...prev, { name: "", jsonPath: "" }]);
    const removeJsonField = (i: number) => setJsonFields((prev: JsonField[]) => prev.filter((_, idx) => idx !== i));
    const updateJsonField = (i: number, field: Partial<JsonField>) => {
        setJsonFields((prev: JsonField[]) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], ...field };
            return copy;
        });
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
                {isNew ? "New Log File Line Config" : `Edit: ${shortName}`}
            </h2>
            <div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="shortName">Short Name <span className="text-destructive-foreground">*</span></Label>
                    <Input id="shortName" value={shortName} onChange={e => setShortName(e.target.value)} autoComplete="off" placeholder="e.g. nginx-combined" />
                    <span className="text-xs text-destructive-foreground">{errors.shortName}</span>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label>Tags</Label>
                    <TagSet
                        tags={tags}
                        onAdd={onAddTag}
                        onRename={onRenameTag}
                        onRemove={onRemoveTag}
                    />
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="description">Description</Label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-[--input-border] bg-[--input-bg] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="lineType">Line Type <span className="text-destructive-foreground">*</span></Label>
                    <select
                        id="lineType"
                        value={lineType}
                        onChange={e => setLineType(e.target.value as any)}
                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--foreground)' }}
                        className="w-full border border-[--input-border] bg-[--input-bg] text-foreground px-2 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="text">Text</option>
                        <option value="xml">XML</option>
                        <option value="json">JSON</option>
                    </select>
                </div>

                {/* Fields sections */}
                {lineType === "text" && (
                    <section className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span>Fields</span>
                            <Button size="sm" onClick={addField}>+ Add Field</Button>
                        </div>
                        {fields.map((f, i) => (
                            <div key={i} className="border border-border rounded-sm p-2 mb-2">
                                <div className="flex gap-2 items-center mb-1">
                                    <Input placeholder="Name" value={f.name} onChange={e => updateField(i, { name: e.target.value })} className="flex-1" />
                                    <Button variant="secondary" size="sm" onClick={() => removeField(i)}>Remove</Button>
                                </div>
                                <div className="flex gap-2 mb-1">
                                    <select
                                        value={f.extraction.kind}
                                        onChange={e => updateField(i, { extraction: { ...f.extraction, kind: e.target.value as ExtractionKind } })}
                                        style={{ backgroundColor: 'var(--input-bg)', color: 'var(--foreground)' }}
                                        className="border border-[--input-border] bg-[--input-bg] text-foreground px-2 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="prefix-suffix">Prefix / Suffix</option>
                                        <option value="regex">Regex</option>
                                    </select>
                                </div>
                                {f.extraction.kind === "prefix-suffix" ? (
                                    <div className="flex gap-2 mb-1">
                                        <Input placeholder="Prefix" value={f.extraction.prefix} onChange={e => updateField(i, { extraction: { ...f.extraction, prefix: e.target.value } })} />
                                        <Input placeholder="Suffix" value={f.extraction.suffix} onChange={e => updateField(i, { extraction: { ...f.extraction, suffix: e.target.value } })} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 mb-1">
                                        <Input placeholder="Pattern" value={f.extraction.pattern} onChange={e => updateField(i, { extraction: { ...f.extraction, pattern: e.target.value } })} />
                                        <div className="flex gap-2 items-center">
                                            <Input placeholder="Sample log line" value={f.sample} onChange={e => updateField(i, { sample: e.target.value })} />
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
                    <Button type="button" variant="default" size="default" onClick={onSave}>Save</Button>
                    <Button variant="secondary" size="default" onClick={onCancel}>Cancel</Button>
                </div>

                {status && (
                    <div className={`text-xs ${status.kind === 'success' ? 'text-terminal-ansiGreen' : status.kind === 'error' ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>{status.text}</div>
                )}
            </div>
        </div>
    );
}
