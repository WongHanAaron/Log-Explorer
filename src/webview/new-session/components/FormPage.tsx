import { useCallback } from "react";
import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Label } from "../../shared/components/ui/label";
import { SourcesTable } from "./SourcesTable";
import type { TemplateData, FormValues, SourceLogConfigReference } from "../App";

interface FormPageProps {
    selectedTemplate: TemplateData | null;
    form: FormValues;
    onFormChange: (values: FormValues) => void;
    error: string | null;
    onBack: () => void;
    onSubmit: (values: FormValues) => void;
}

export function FormPage({
    selectedTemplate,
    form,
    onFormChange,
    error,
    onBack,
    onSubmit,
}: FormPageProps) {
    const update = useCallback(
        <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
            onFormChange({ ...form, [key]: value });
        },
        [form, onFormChange]
    );

    const handleSubmit = useCallback(() => {
        if (!form.name.trim()) { return; }
        onSubmit(form);
    }, [form, onSubmit]);

    const handleParamChange = useCallback(
        (paramName: string, value: string) => {
            onFormChange({ ...form, parameters: { ...form.parameters, [paramName]: value } });
        },
        [form, onFormChange]
    );

    const handleSourcesChange = useCallback(
        (sources: SourceLogConfigReference[]) => update("sources", sources),
        [update]
    );

    const title = selectedTemplate?.name ?? "New Session";
    const description = selectedTemplate?.description ?? "";
    const params = selectedTemplate?.parameters ?? [];

    return (
        <div className="min-h-screen overflow-y-auto">
            <div className="mx-auto max-w-3xl px-14 py-12">

                {/* Back navigation */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs text-[--ring] hover:underline mb-5 bg-transparent border-0 cursor-pointer p-0"
                >
                    ← New Session
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-light tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>

                {/* Form body — constrained width */}
                <div className="max-w-lg flex flex-col gap-5">

                    {/* Session Name */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="session-name">
                            Session Name <span className="text-destructive-foreground">*</span>
                        </Label>
                        <Input
                            id="session-name"
                            placeholder="e.g. prod-incident-2026-02-28"
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            className={!form.name.trim() && error ? "ring-1 ring-destructive-foreground" : ""}
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="session-description">Description</Label>
                        <Input
                            id="session-description"
                            placeholder="Optional description"
                            value={form.description}
                            onChange={e => update("description", e.target.value)}
                        />
                    </div>

                    {/* Time Start */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="time-start">Time Start</Label>
                        <Input
                            id="time-start"
                            type="datetime-local"
                            value={form.timeStart}
                            onChange={e => update("timeStart", e.target.value)}
                        />
                    </div>

                    {/* Dynamic template parameters */}
                    {params.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {params.map(param => (
                                <div key={param.name} className="flex flex-col gap-1.5">
                                    <Label>{param.name}</Label>
                                    <Input
                                        placeholder={param.name}
                                        value={form.parameters[param.name] ?? ""}
                                        onChange={e => handleParamChange(param.name, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sources */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Sources</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() =>
                                    handleSourcesChange([
                                        ...form.sources,
                                        { type: "file", sourceConfig: "", logConfig: "" },
                                    ])
                                }
                            >
                                + Add Source
                            </Button>
                        </div>
                        <SourcesTable
                            sources={form.sources}
                            onChange={handleSourcesChange}
                        />
                    </div>

                    {/* Error feedback */}
                    {error && (
                        <p className="text-xs text-destructive-foreground">{error}</p>
                    )}

                    {/* Submit */}
                    <div className="flex items-center gap-3 pt-1">
                        <Button
                            onClick={handleSubmit}
                            disabled={!form.name.trim()}
                        >
                            Create Session
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
