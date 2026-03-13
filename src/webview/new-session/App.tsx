import { useEffect, useCallback, useState } from "react";
import { getVsCodeApi } from "../shared/lib/vscode";
import { DiscoveryPage } from "./components/DiscoveryPage";
import { FormPage } from "./components/FormPage";
// bring in types from shared types module (App also re-exports them above)
import type {
    SourceLogConfigReference,
    TemplateData,
    SessionSummary,
    FormValues,
} from "./types";

// ---------------------------------------------------------------------------
// Types (mirrored from extension-side contracts)
// ---------------------------------------------------------------------------

// the actual definitions live in types.ts so that both App and FormPage can
// reference them without creating a runtime import cycle.
export type {
    SourceLogConfigReference,
    TemplateData,
    SessionSummary,
    FormValues,
} from "./types";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type Page = "discovery" | "form";

export function App() {
    const vscode = getVsCodeApi();

    // Page routing
    const [page, setPage] = useState<Page>("discovery");

    // Data from extension
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);

    // configuration names available for dropdowns
    const [fileConfigs, setFileConfigs] = useState<string[]>([]);
    const [logConfigs, setLogConfigs] = useState<string[]>([]);

    // Currently selected template (carries into FormPage)
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

    // Form values (lifted so FormPage can be pre-populated from extension)
    const [form, setForm] = useState<FormValues>({
        name: "", description: "", timeStart: "", parameters: {}, sources: [],
    });

    // Form feedback
    const [formError, setFormError] = useState<string | null>(null);

    // ---------------------------------------------------------------------------
    // VS Code messaging
    // ---------------------------------------------------------------------------

    const handleSessionCreated = useCallback((session: SessionSummary) => {
        // Prepend to recent sessions list
        setRecentSessions(prev => [session, ...prev.filter(s => s.folderName !== session.folderName)]);
        // Reset form and go back to discovery
        setForm({ name: "", description: "", timeStart: "", parameters: {}, sources: [] });
        setSelectedTemplate(null);
        setFormError(null);
        setPage("discovery");
    }, []);

    const handleLoadSession = useCallback((session: {
        name: string;
        description: string;
        templateName: string | null;
        parameters: Record<string, string>;
        timeStart: string;
        sources?: SourceLogConfigReference[]; // incoming data may omit field
    }) => {
        const match = session.templateName
            ? templates.find(t => t.name === session.templateName) ?? null
            : null;
        setSelectedTemplate(match);
        // ensure fields are well-formed; guard against undefined/null values
        setForm({
            name: session.name,
            description: session.description,
            timeStart: session.timeStart,
            parameters: session.parameters ?? {},
            sources: session.sources ?? [],
        });
        setFormError(null);
        setPage("form");
    }, [templates]);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            switch (msg.type) {
                case "init":
                    setTemplates(msg.templates ?? []);
                    setRecentSessions(msg.recentSessions ?? []);
                    setFileConfigs(msg.fileConfigs ?? []);
                    setLogConfigs(msg.logConfigs ?? []);
                    break;
                case "sessionCreated":
                    handleSessionCreated(msg.session);
                    break;
                case "templateSaved":
                    // add the new template and select it automatically
                    setTemplates(prev => [...prev, msg.template]);
                    setSelectedTemplate(msg.template);
                    break;
                case "sessionError":
                    setFormError(msg.message ?? "An error occurred.");
                    break;
                case "loadSession":
                    handleLoadSession(msg.session);
                    break;
            }
        };

        window.addEventListener("message", handler);
        // Signal the extension that we're ready
        vscode.postMessage({ type: "ready" });
        return () => window.removeEventListener("message", handler);
    }, [handleSessionCreated, handleLoadSession, vscode]);

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const handleSelectTemplate = useCallback((tpl: TemplateData) => {
        setSelectedTemplate(tpl);
        // Pre-populate sources and reset parameters from template
        const defaultParams: Record<string, string> = {};
        for (const p of tpl.parameters || []) { defaultParams[p.name] = ""; }
        setForm(prev => ({
            ...prev,
            parameters: defaultParams,
            sources: tpl.sources ?? [],
        }));
        setFormError(null);
        setPage("form");
    }, []);

    const handleOpenSession = useCallback((folderName: string) => {
        vscode.postMessage({ type: "openSession", folderName });
    }, [vscode]);

    const handleBack = useCallback(() => {
        setPage("discovery");
        setFormError(null);
    }, []);

    const handleSubmit = useCallback((values: FormValues) => {
        setFormError(null);
        vscode.postMessage({
            type: "submitSession",
            payload: {
                name: values.name.trim(),
                description: values.description,
                templateName: selectedTemplate?.name ?? null,
                parameters: values.parameters,
                timeStart: values.timeStart,
                sources: values.sources,
            },
        });
    }, [vscode, selectedTemplate]);

    const handleStartBlank = useCallback(() => {
        setSelectedTemplate(null);
        setForm({ name: "", description: "", timeStart: "", parameters: {}, sources: [] });
        setFormError(null);
        setPage("form");
    }, []);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    if (page === "form") {
        return (
            <FormPage
                selectedTemplate={selectedTemplate}
                form={form}
                onFormChange={setForm}
                error={formError}
                onBack={handleBack}
                onSubmit={handleSubmit}
                onSaveTemplate={tpl => vscode.postMessage({ type: 'saveSessionTemplate', payload: tpl })}
                fileConfigs={fileConfigs}
                logConfigs={logConfigs}
            />
        );
    }

    return (
        <DiscoveryPage
            templates={templates}
            recentSessions={recentSessions}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            onOpenSession={handleOpenSession}
            onStartBlank={handleStartBlank}
        />
    );
}
