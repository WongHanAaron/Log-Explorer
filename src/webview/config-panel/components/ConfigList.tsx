import React, { useState, useRef } from "react";

export interface ConfigListProps {
    names: string[];
    selected?: string | null;
    onSelect: (name: string) => void;
}

export const ConfigList: React.FC<ConfigListProps> = ({ names, selected, onSelect }) => {
    const [searchText, setSearchText] = useState("");
    const searchTimer = useRef<number | null>(null);

    const filtered = names.filter(n => n.toLowerCase().includes(searchText.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (filtered.length === 0) return;
            const idx = filtered.findIndex(x => x === selected);
            let next = 0;
            if (idx !== -1) {
                if (e.key === 'ArrowDown') {
                    next = (idx + 1) % filtered.length;
                } else {
                    next = (idx - 1 + filtered.length) % filtered.length;
                }
            }
            const name = filtered[next];
            onSelect(name);
        } else if (e.key === 'Enter' && selected) {
            onSelect(selected);
        }
    };

    return (
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
            {filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground">No configs found.</div>
            ) : (
                <ul
                    className="list-none p-0 m-0"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                >
                    {filtered.map(n => (
                        <li
                            key={n}
                            className={`px-2 py-1 cursor-pointer ${n === selected ? 'bg-[--list-activeSelectionBackground]' : ''}`}
                            onClick={() => onSelect(n)}
                        >
                            {n}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};