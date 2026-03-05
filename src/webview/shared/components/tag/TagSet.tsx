import React, { useState, useEffect, useCallback } from "react";
import { Tag } from "./Tag";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export interface TagSetProps {
    tags: string[];
    onAdd: (tag: string) => void;
    onRename: (index: number, newTag: string) => void;
    onRemove: (index: number) => void;
    maxTags?: number;
    validate?: (tags: string[]) => string | null;
}

export function TagSet({
    tags,
    onAdd,
    onRename,
    onRemove,
    maxTags,
    validate,
}: TagSetProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (validate) {
            setError(validate(tags));
        } else {
            setError(null);
        }
    }, [tags, validate]);

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditingValue(tags[index]);
    };

    const finishEdit = () => {
        if (editingIndex === null) return;
        const value = editingValue.trim();
        // if editing existing tag and blank -> remove
        if (value === "") {
            onRemove(editingIndex);
            setEditingIndex(null);
            setEditingValue("");
            return;
        }
        const lower = value.toLowerCase();
        const existing = tags.findIndex(
            (t, i) => i !== editingIndex && t.toLowerCase() === lower
        );
        if (existing !== -1) {
            // merge: update casing on existing and remove current if new
            onRename(existing, value);
            if (editingIndex !== existing) {
                onRemove(editingIndex);
            }
        } else {
            if (editingIndex === tags.length) {
                // new tag case
                onAdd(value);
            } else {
                onRename(editingIndex, value);
            }
        }
        setEditingIndex(null);
        setEditingValue("");
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingValue("");
    };

    const handleAddClick = () => {
        if (maxTags !== undefined && tags.length >= maxTags) return;
        setEditingIndex(tags.length);
        setEditingValue("");
    };

    const handleRename = (idx: number, v: string) => {
        setEditingIndex(idx);
        setEditingValue(v);
    };

    const displayTags = [...tags];

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {displayTags.map((tag, i) => (
                <Tag
                    key={i}
                    value={editingIndex === i ? editingValue : tag}
                    editing={editingIndex === i}
                    onClick={() => startEdit(i)}
                    onChange={v => setEditingValue(v)}
                    onSubmit={finishEdit}
                    onCancel={cancelEdit}
                    onRemove={() => onRemove(i)}
                />
            ))}
            {editingIndex === tags.length && (
                <Tag
                    value={editingValue}
                    editing
                    onChange={v => setEditingValue(v)}
                    onSubmit={finishEdit}
                    onCancel={cancelEdit}
                />
            )}
            <Button
                size="sm"
                variant="secondary"
                onClick={handleAddClick}
                disabled={maxTags !== undefined && tags.length >= maxTags}
                className="flex items-center gap-1"
            >
                <Plus className="h-4 w-4" />
                Add
            </Button>
            {error && (
                <div className="text-xs text-destructive-foreground ml-2">
                    {error}
                </div>
            )}
        </div>
    );
}
