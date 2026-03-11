import React, { useState, useEffect } from "react";
import { ConfigList } from "./components/ConfigList";
import { confirmDiscard } from "./components/FormWrapper";

// VS Code API helper (cached instance)
import { getVsCodeApi } from "../vscodeApi";
const vscode = getVsCodeApi();

export interface GenericAppProps {
    onConfigData?: (cfg: any | null) => void; // null indicates no config or error
    onError?: (message: string) => void;      // error from host (parse failure, etc.)
    dirty?: boolean;
    children?: React.ReactNode | ((props: { selectedName: string | null }) => React.ReactNode);
}

export const App: React.FC<GenericAppProps> = ({ onConfigData, onError, dirty = false, children }) => {
    const [names, setNames] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string | null>(null);

    useEffect(() => {
        function handler(event: MessageEvent) {
            const msg = event.data;
            switch (msg.type) {
                case "init":
                    setNames(msg.configs || []);
                    if (msg.current && onConfigData) {
                        onConfigData(msg.current);
                    }
                    // highlight initial config if provided
                    if (msg.current && typeof msg.current.shortName === 'string') {
                        setSelectedName(msg.current.shortName);
                    }
                    break;
                case "configListChanged":
                    setNames(msg.configs || []);
                    if (selectedName && !msg.configs.includes(selectedName)) {
                        setSelectedName(null);
                        onConfigData && onConfigData(null);
                    }
                    break;
                case "configData":
                    if (msg.config != null) {
                        onConfigData && onConfigData(msg.config);
                    } else {
                        // config null indicates either deletion or error
                        onConfigData && onConfigData(null);
                        if (msg.error && onError) {
                            onError(msg.error);
                        }
                    }
                    break;
                case "configError":
                    if (msg.error && onError) {
                        onError(msg.error);
                    }
                    break;
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [selectedName, onConfigData, onError]);

    const handleSelect = (name: string) => {
        if (!confirmDiscard(dirty)) {
            return;
        }
        setSelectedName(name);
        vscode.postMessage({ type: "selectConfig", name });
    };

    return (
        <div className="flex h-full">
            <ConfigList names={names} selected={selectedName} onSelect={handleSelect} />
            <div className="flex-1 overflow-auto">
                {typeof children === "function" ? (children as any)({ selectedName }) : children}
            </div>
        </div>
    );
};
