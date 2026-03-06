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
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
        onKeyDown,
    } = props;
    const [hovered, setHovered] = React.useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    // native event handler needs stable identity so we can add/remove it.
    const nativeHandler = React.useCallback((e: KeyboardEvent) => {
        // notify parent via React prop (if supplied) even before any synthetic
        // handlers or form submissions occur.  cast to any because DOM event
        // types differ slightly from React's.
        if (onKeyDown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onKeyDown(e as any);
        }
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            onSubmit && onSubmit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel && onCancel();
        }
    }, [onSubmit, onCancel, onKeyDown]);

    const setInputRef = (el: HTMLInputElement | null) => {
        if (inputRef.current) {
            inputRef.current.removeEventListener('keydown', nativeHandler, true);
        }
        inputRef.current = el;
        if (el) {
            el.addEventListener('keydown', nativeHandler, true);
        }
    };

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // synthetic handler kept for completeness, but because React events are
        // invoked after native events, we also attach a native listener below to
        // guarantee prevention of the default form submission behaviour.
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            onSubmit && onSubmit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel && onCancel();
        }
    };


    // for keypress/keyup events we only need to inhibit the default behavior
    // and stop propagation; the actual submission logic is handled on keydown
    // (above), so we don't call onSubmit again here.
    const inhibitForm = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    if (editing) {
        return (
            <Input
                data-testid="tag-input"
                ref={setInputRef}
                value={value}
                onChange={e => onChange && onChange(e.target.value)}
                onBlur={() => onSubmit && onSubmit()}
                onKeyDown={e => {
                    onKeyDown && onKeyDown(e);
                    handleKeyDown(e);
                }}
                onKeyPress={inhibitForm}
                onKeyUp={inhibitForm}
                className="h-6 px-2 min-w-[4rem] w-auto text-center"
            />
        );
    }

    return (
        <Button
            size="sm"
            variant="default"
            className="relative rounded-full text-center items-center leading-none px-3 py-1"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span className={
                `relative transition-transform duration-200 ${hovered ? '-translate-x-1' : ''} -top-px`
            }>
                {value}
            </span>
            {onRemove && (
                <X
                    className={
                        `absolute right-1 h-3 w-3 cursor-pointer text-destructive-foreground transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`
                    }
                    onClick={e => {
                        e.stopPropagation();
                        onRemove();
                    }}
                />
            )}
        </Button>
    );
}
