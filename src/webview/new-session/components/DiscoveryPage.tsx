import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, sortableHeader } from "../../shared/components/ui/data-table";
import { Button } from "../../shared/components/ui/button";
import type { TemplateData, SessionSummary } from "../App";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const templateColumns: ColumnDef<TemplateData>[] = [
    {
        accessorKey: "name",
        header: sortableHeader<TemplateData>("Template"),
        cell: ({ row }) => (
            <div>
                <p className="text-xs font-medium leading-tight">{row.original.name}</p>
                <p className="text-xs text-muted-foreground leading-tight truncate max-w-[180px]">
                    {row.original.description}
                </p>
            </div>
        ),
    },
];

const sessionColumns: ColumnDef<SessionSummary>[] = [
    {
        accessorKey: "name",
        header: sortableHeader<SessionSummary>("Session"),
        cell: ({ row }) => (
            <div>
                <p className="text-xs font-medium leading-tight">{row.original.name}</p>
                <p className="text-xs text-muted-foreground leading-tight truncate max-w-[180px]">
                    {row.original.description}
                </p>
            </div>
        ),
    },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DiscoveryPageProps {
    templates: TemplateData[];
    recentSessions: SessionSummary[];
    selectedTemplate: TemplateData | null;
    onSelectTemplate: (tpl: TemplateData) => void;
    onOpenSession: (folderName: string) => void;
    onStartBlank: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscoveryPage({
    templates,
    recentSessions,
    selectedTemplate,
    onSelectTemplate,
    onOpenSession,
    onStartBlank,
}: DiscoveryPageProps) {
    // Stable column refs to avoid re-render churn
    const tplCols = useMemo(() => templateColumns, []);
    const sesCols = useMemo(() => sessionColumns, []);

    return (
        <div className="min-h-screen overflow-y-auto">
            <div className="mx-auto max-w-4xl px-14 py-12">

                {/* Page header */}
                <h1 className="text-2xl font-light tracking-tight mb-1">New Session</h1>
                <p className="text-sm text-muted-foreground mb-10">
                    Choose a template or open a recent session to get started.
                </p>

                {/* 2 × 2 grid — no borders, generous gap */}
                <div className="grid grid-cols-2 gap-x-14 gap-y-10">

                    {/* ── Templates ──────────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            New Session Templates
                        </p>
                        <DataTable
                            columns={tplCols}
                            data={templates}
                            searchPlaceholder="Search templates…"
                            onRowClick={onSelectTemplate}
                            selectedRow={selectedTemplate}
                            rowKey={r => r.id}
                            emptyMessage="No templates found."
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="self-start text-xs h-6 px-1 text-muted-foreground hover:text-foreground"
                            onClick={onStartBlank}
                        >
                            + New blank session
                        </Button>
                    </div>

                    {/* ── Getting Started ─────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Getting Started
                        </p>
                        <p className="text-xs text-muted-foreground italic">Coming soon.</p>
                    </div>

                    {/* ── Recent Sessions ─────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Recent Sessions
                        </p>
                        <DataTable
                            columns={sesCols}
                            data={recentSessions}
                            searchPlaceholder="Search sessions…"
                            onRowClick={s => onOpenSession(s.folderName)}
                            emptyMessage="No recent sessions."
                        />
                    </div>

                    {/* ── Local Logs ──────────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Local Logs
                        </p>
                        <p className="text-xs text-muted-foreground italic">Coming soon.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
