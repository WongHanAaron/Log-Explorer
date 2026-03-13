import React, { useState, useEffect, useCallback } from "react";
import type { HostToWebviewMessage, WebviewToHostMessage } from "../messages";
import { FormPage } from "./components/FormPage";
import { App as GenericApp } from "../config-panel/App";
import { normalizeSettings } from "./utils";

// VS Code API helper (cached instance)
import { getVsCodeApi } from "../vscodeApi";
const vscode = getVsCodeApi();

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/; // kebab-case pattern used for short names

export function App() {
    const [shortName, setShortName] = useState("");
    const [adapterType, setAdapterType] = useState("local");
    const [settings, setSettings] = useState<Record<string, any>>({});

    const [isNew, setIsNew] = useState(true);
    const [originalShortName, setOriginalShortName] = useState<string | null>(null);
    const [errors, setErrors] = useState({ shortName: "" });
    const [status, setStatus] = useState<{ text: string; kind: "info" | "success" | "error" } | null>(null);
    const [nameAvailable, setNameAvailable] = useState(true);
    const [savedConfig, setSavedConfig] = useState<any | null>(null);
    const [canSave, setCanSave] = useState(false);

    const dirty = React.useMemo(() => {
        if (isNew) {
            // when creating a new config the form is considered "dirty" only if
            // the user has actually entered something other than the default
            // values.  `adapterType` defaults to "local" so including it in the
            // check means the freshly‑opened panel is always dirty (as noted in
            // the original bug report).  this produced a confirmation dialog
            // every time the user clicked an existing entry which they often
            // dismissed thinking the item hadn't loaded.  ignore the adapter
            // type for the new‑config case so that switching to a saved config
            // works without prompting.
            return !!(
                shortName.trim() ||
                Object.keys(settings).length ||
                // treat adapter other than the default as a user change
                (adapterType && adapterType !== 'local')
            );
        }
        if (!savedConfig) {
            return false;
        }
        return (
            shortName !== savedConfig.shortName ||
            adapterType !== savedConfig.adapterType ||
            JSON.stringify(settings) !== JSON.stringify(savedConfig.settings)
        );
    }, [isNew, shortName, adapterType, settings, savedConfig]);

    useEffect(() => {
        function handler(event: MessageEvent) {
            const msg = event.data as HostToWebviewMessage;
            switch (msg.type) {
                case "fileaccess-config:name-available": {
                    setNameAvailable(msg.available);
                    if (!msg.available && (isNew || shortName.trim() !== originalShortName)) {
                        setStatus({ text: "A configuration with that name already exists. Saving will overwrite.", kind: "info" });
                    }
                    break;
                }
                case "fileaccess-config:save-result": {
                    if (msg.success) {
                        setStatus({ text: "Saved successfully.", kind: "success" });
                        if (isNew) {
                            setIsNew(false);
                            setOriginalShortName(shortName);
                        }
                        setSavedConfig({ shortName, adapterType, settings });
                    } else {
                        setStatus({ text: `Error: ${msg.errorMessage ?? "Save failed."}`, kind: "error" });
                    }
                    break;
                }
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [isNew, shortName]);

    const validateForm = useCallback(() => {
        let valid = true;
        const errs = { shortName: "" };
        if (!shortName.trim()) {
            errs.shortName = "Short name is required.";
            valid = false;
        } else if (!KEBAB_RE.test(shortName.trim())) {
            errs.shortName = "Short name must be kebab-case (lowercase letters, digits, hyphens).";
            valid = false;
        }
        setErrors(errs);
        return valid;
    }, [shortName]);

    useEffect(() => {
        const valid = validateForm();
        const trimmed = {
            shortName: shortName.trim(),
            adapterType,
            settings,
        };
        const dirtyUnderlying = !savedConfig ||
            savedConfig.shortName !== trimmed.shortName ||
            savedConfig.adapterType !== trimmed.adapterType ||
            JSON.stringify(savedConfig.settings) !== JSON.stringify(trimmed.settings);
        setCanSave(valid && dirtyUnderlying);
    }, [shortName, adapterType, settings, savedConfig, validateForm]);

    useEffect(() => {
        vscode.postMessage({ type: "ready" });
    }, []);

    const onShortNameBlur = () => {
        const nameVal = shortName.trim();
        if (!nameVal || !KEBAB_RE.test(nameVal)) return;
        if (isNew || nameVal !== originalShortName) {
            vscode.postMessage({ type: "fileaccess-config:validate-name", shortName: nameVal });
        }
    };

    const save = () => {
        setStatus(null);
        if (!validateForm()) return;
        const nameVal = shortName.trim();
        if (!nameAvailable && (isNew || nameVal !== originalShortName)) {
            const proceed = window.confirm(
                "A configuration with that name already exists. Do you want to overwrite it?"
            );
            if (!proceed) return;
        }
        setStatus({ text: "Saving…", kind: "info" });
        vscode.postMessage({
            type: "fileaccess-config:save",
            config: { shortName: nameVal, adapterType, settings },
        });
    };

    const onCancel = () => {
        vscode.postMessage({ type: "fileaccess-config:cancel" });
    };

    return (
        <GenericApp
            onConfigData={cfg => {
                if (cfg) {
                    setShortName(cfg.shortName);
                    setAdapterType(cfg.adapterType);
                    // guard against corrupted `settings` (arrays, null, strings, etc.)
                    const safeSettings = normalizeSettings(cfg.settings);
                    setSettings(safeSettings);
                    setOriginalShortName(cfg.shortName);
                    setSavedConfig(cfg);
                    setIsNew(false);
                } else {
                    setShortName("");
                    setAdapterType("local");
                    setSettings({});
                    setOriginalShortName(null);
                    setSavedConfig(null);
                    setIsNew(true);
                }
            }}
            onError={msg => setStatus({ text: msg, kind: 'error' })}
            dirty={dirty}
        >
            {() => (
                <FormPage
                    shortName={shortName}
                    setShortName={setShortName}
                    adapterType={adapterType}
                    setAdapterType={setAdapterType}
                    settings={settings}
                    setSettings={setSettings}
                    isNew={isNew}
                    errors={errors}
                    status={status}
                    onShortNameBlur={onShortNameBlur}
                    onSave={save}
                    onCancel={onCancel}
                    originalShortName={originalShortName}
                    canSave={canSave}
                />
            )}
        </GenericApp>
    );
}
