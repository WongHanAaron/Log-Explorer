import { useCallback } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../../shared/components/ui/table";
import type { SourceLogConfigReference } from "../App";

interface SourcesTableProps {
    sources: SourceLogConfigReference[];
    onChange: (sources: SourceLogConfigReference[]) => void;
}

export function SourcesTable({ sources, onChange }: SourcesTableProps) {
    const update = useCallback(
        (index: number, patch: Partial<SourceLogConfigReference>) => {
            const next = sources.map((s, i) => (i === index ? { ...s, ...patch } : s));
            onChange(next);
        },
        [sources, onChange]
    );

    const remove = useCallback(
        (index: number) => { onChange(sources.filter((_, i) => i !== index)); },
        [sources, onChange]
    );

    if (sources.length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic">No sources added.</p>
        );
    }

    return (
        <div className="overflow-auto border border-border rounded-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-20">Type</TableHead>
                        <TableHead>Source Config</TableHead>
                        <TableHead>Log Config</TableHead>
                        <TableHead className="w-8" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sources.map((source, index) => (
                        <TableRow key={index}>
                            <TableCell className="py-1 pr-2">
                                <select
                                    value={source.type}
                                    onChange={e => update(index, { type: e.target.value as "file" | "kibana" })}
                                    className="w-full bg-[--input-bg] border border-[--input-border] text-foreground text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="file">file</option>
                                    <option value="kibana">kibana</option>
                                </select>
                            </TableCell>
                            <TableCell className="py-1 pr-2">
                                <input
                                    type="text"
                                    placeholder="Source config name"
                                    value={source.sourceConfig}
                                    onChange={e => update(index, { sourceConfig: e.target.value })}
                                    className="w-full bg-[--input-bg] border border-[--input-border] text-foreground text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </TableCell>
                            <TableCell className="py-1 pr-2">
                                <input
                                    type="text"
                                    placeholder="Log config name"
                                    value={source.logConfig}
                                    onChange={e => update(index, { logConfig: e.target.value })}
                                    className="w-full bg-[--input-bg] border border-[--input-border] text-foreground text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </TableCell>
                            <TableCell className="py-1 text-center">
                                <button
                                    onClick={() => remove(index)}
                                    title="Remove"
                                    className="text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer px-1 text-sm leading-none"
                                >
                                    ✕
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
