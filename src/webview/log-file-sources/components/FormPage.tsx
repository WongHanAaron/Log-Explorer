import React from "react";
import { Input } from "../../shared/components/ui/input";
import { Button } from "../../shared/components/ui/button";
import { Label } from "../../shared/components/ui/label";
import { TagSet } from "../../shared/components/tag/TagSet";

export interface FormPageProps {
    shortName: string;
    setShortName: (s: string) => void;
    label: string;
    setLabel: (s: string) => void;
    pathPattern: string;
    setPathPattern: (s: string) => void;
    description: string;
    setDescription: (s: string) => void;
    tags: string[];
    onAddTag: (tag: string) => void;
    onRenameTag: (index: number, tag: string) => void;
    onRemoveTag: (index: number) => void;
    isNew: boolean;
    errors: { shortName?: string; label?: string; pathPattern?: string };
    status: { text: string; kind: "info" | "success" | "error" } | null;
    validateForm: () => boolean;
    onShortNameBlur: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    originalShortName: string | null;
}

export function FormPage({
    shortName,
    setShortName,
    label,
    setLabel,
    pathPattern,
    setPathPattern,
    description,
    setDescription,
    tags,
    onAddTag,
    onRenameTag,
    onRemoveTag,
    isNew,
    errors,
    status,
    validateForm,
    onShortNameBlur,
    onSubmit,
    onCancel,
    originalShortName,
}: FormPageProps) {
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
                <div className="flex flex-col gap-1 mb-3">
                    <Label>Tags</Label>
                    <TagSet
                        tags={tags}
                        onAdd={onAddTag}
                        onRename={onRenameTag}
                        onRemove={onRemoveTag}
                        maxTags={undefined}
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
