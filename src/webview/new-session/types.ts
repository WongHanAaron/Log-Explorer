// Shared types used by new-session panel components

export interface SourceLogConfigReference {
    type: "file" | "kibana";
    sourceConfig: string;
    logConfig: string;
}

export interface TemplateData {
    id: string;
    name: string;
    description: string;
    parameters: Array<{ name: string }>;
    sources: SourceLogConfigReference[];
}

export interface SessionSummary {
    name: string;
    description: string;
    folderName: string;
}

export interface FormValues {
    name: string;
    description: string;
    timeStart: string;
    parameters: Record<string, string>;
    sources: SourceLogConfigReference[];
}
