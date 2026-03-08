// Shared payload shapes for the log-file-lines webview.
// These correspond to the domain classes but are kept light-weight and
// purely structural so they can be used in the browser without dragging in
// class-transformer/validator.

export interface TextField {
    name: string;
    extraction: {
        kind: 'prefix-suffix' | 'regex';
        prefix?: string;
        suffix?: string;
        pattern?: string;
    };
    datetime?: string;
}

export interface XmlField {
    name: string;
    xpath: string;
}

export interface JsonField {
    name: string;
    jsonPath: string;
    datetime?: string;
}

export type FileLogLineConfigPayload =
    | {
        type: 'text';
        shortName: string;
        fields: TextField[];
        description?: string;
        tags?: string[];
    }
    | {
        type: 'xml';
        shortName: string;
        fields: XmlField[];
        description?: string;
        tags?: string[];
    }
    | {
        type: 'json';
        shortName: string;
        fields: JsonField[];
        description?: string;
        tags?: string[];
    };
