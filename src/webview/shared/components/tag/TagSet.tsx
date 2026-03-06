import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tag } from "./Tag";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export interface TagSetProps {
    tags: string[];
    onAdd: (tag: string) => void;
    onRename: (index: number, newTag: string) => void;
    onRemove: (index: number) => void;
    /** called for every keydown in the editing input */
    onTagKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    maxTags?: number;
    validate?: (tags: string[]) => string | null;
}

export function TagSet({
    tags,
    onAdd,
    onRename,
    onRemove,
    onTagKeyDown,
    maxTags,
    validate,
}: TagSetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const justCommitted = useRef(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    // if a <form> is submitted while focus resides inside this component we
    // want to cancel it.  browsers will fire 'submit' on the form as a default
    // action when Enter is pressed inside a text input, and the event is not
    // cancellable by stopping propagation of the key event alone.  attaching a
    // capture listener at the document level lets us intercept the submit event
    // early and prevent accidental saves.
    useEffect(() => {
        const handler = (evt: Event) => {
            if (justCommitted.current) {
                evt.preventDefault();
                evt.stopPropagation();
                justCommitted.current = false;
                return;
            }
            if (containerRef.current && containerRef.current.contains(document.activeElement)) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        };
        document.addEventListener('submit', handler, true);
        return () => document.removeEventListener('submit', handler, true);
    }, []);

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
        // mark that we are finishing an edit; this helps prevent the outer
        // form from immediately submitting due to the Enter key that triggered
        // the commit.  the submit listener will see this flag and cancel the
        // event.
        justCommitted.current = true;
        let value = editingValue.trim();
        // normalize to lowercase per requirements
        value = value.toLowerCase();
        // if editing existing tag and blank -> remove
        if (value === "") {
            console.log('TagSet.finishEdit: removing tag at', editingIndex);
            onRemove(editingIndex);
            setEditingIndex(null);
            setEditingValue("");
            return;
        }
        const existing = tags.findIndex(
            (t, i) => i !== editingIndex && t.toLowerCase() === value
        );
        if (existing !== -1) {
            // merge: update casing on existing and remove current if new
            console.log('TagSet.finishEdit: merging tag', value, 'into index', existing);
            onRename(existing, value);
            if (editingIndex !== existing) {
                onRemove(editingIndex);
            }
        } else {
            if (editingIndex === tags.length) {
                // new tag case
                console.log('TagSet.finishEdit: adding new tag', value);
                onAdd(value);
            } else {
                console.log('TagSet.finishEdit: renaming tag at', editingIndex, 'to', value);
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
        <div ref={containerRef} className="flex flex-wrap gap-2 items-center">
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
                    onKeyDown={e => onTagKeyDown && onTagKeyDown(e)}
                />
            ))}
            {editingIndex === tags.length && (
                <Tag
                    value={editingValue}
                    editing
                    onChange={v => setEditingValue(v)}
                    onSubmit={finishEdit}
                    onCancel={cancelEdit}
                    onKeyDown={e => onTagKeyDown && onTagKeyDown(e)}
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
