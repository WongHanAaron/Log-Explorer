import React, { useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X } from "lucide-react";

export interface TagProps {
    value: string;
    editing?: boolean;
    onClick?: () => void;       // invoked when pill clicked to start editing
    onChange?: (newValue: string) => void; // used when editing
    onSubmit?: () => void;      // finish editing (blur or enter)
    onCancel?: () => void;      // cancel editing (escape)
    onRemove?: () => void;      // optional remove action
}

// Simple tag/pill that switches to an input when editing flag is set.
export function Tag(props: TagProps) {
    const {
        value,
        editing = false,
        onClick,
        onChange,
        onSubmit,
        onCancel,
        onRemove,
    } = props;

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit && onSubmit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel && onCancel();
        }
    };

    if (editing) {
        return (
            <Input
                ref={inputRef}
                value={value}
                onChange={e => onChange && onChange(e.target.value)}
                onBlur={() => onSubmit && onSubmit()}
                onKeyDown={handleKeyDown}
                className="h-6 px-2 min-w-[4rem] w-auto"
            />
        );
    }

    return (
        <Button
            size="sm"
            variant="default"
            className="capitalize rounded-full"
            onClick={onClick}
        >
            {value}
            {onRemove && (
                <X
                    className="ml-1 h-3 w-3 cursor-pointer text-destructive-foreground hover:text-destructive-foreground"
                    onClick={e => {
                        e.stopPropagation();
                        onRemove();
                    }}
                />
            )}
        </Button>
    );
}
