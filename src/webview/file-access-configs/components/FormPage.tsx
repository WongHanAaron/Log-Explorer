import React from "react";
import { Input } from "../../shared/components/ui/input";
import { Button } from "../../shared/components/ui/button";
import { Label } from "../../shared/components/ui/label";
import { TagSet } from "../../shared/components/tag/TagSet";

export interface FormPageProps {
    shortName: string;
    setShortName: (s: string) => void;
    adapterType: string;
    setAdapterType: (s: string) => void;
    settings: Record<string, any>;
    setSettings: (o: Record<string, any>) => void;
    isNew: boolean;
    errors: { shortName?: string };
    status: { text: string; kind: "info" | "success" | "error" } | null;
    onShortNameBlur: () => void;
    /** invoked when Save button is clicked */
    onSave: () => void;
    onCancel: () => void;
    originalShortName: string | null;
    canSave: boolean;
}

export function FormPage({
    shortName,
    setShortName,
    adapterType,
    setAdapterType,
    settings,
    setSettings,
    isNew,
    errors,
    status,
    onShortNameBlur,
    onCancel,
    originalShortName,
    canSave,
    onSave,
}: FormPageProps) {

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
                {isNew ? "New File Access Config" : `Edit: ${originalShortName}`}
            </h2>
            {/* form fields -- adapter-specific settings rendering not included here */}
            <div>
                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="shortName" className="flex items-center gap-1">
                        Short Name <span className="text-destructive-foreground">*</span>
                    </Label>
                    <Input
                        id="shortName"
                        value={shortName}
                        onChange={e => setShortName(e.target.value)}
                        onBlur={onShortNameBlur}
                        readOnly={!isNew}
                        autoComplete="off"
                        placeholder="e.g. my-config"
                        className={!shortName.trim() && errors.shortName ? "ring-1 ring-destructive-foreground" : ""}
                    />
                    <span className="text-xs text-destructive-foreground">{errors.shortName}</span>
                    <span className="text-xs text-muted-foreground italic">Kebab-case identifier — used as the filename</span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                    <Label htmlFor="adapterType">Adapter Type</Label>
                    <select
                        id="adapterType"
                        value={adapterType}
                        onChange={e => {
                            const v = e.target.value;
                            setAdapterType(v);
                            setSettings({});
                        }}
                        style={{ backgroundColor: 'var(--input-bg)' }}
                        className="w-full border border-[--input-border] bg-[--input-bg] text-foreground px-2 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="local">Local</option>
                        <option value="sftp">SFTP</option>
                        <option value="smb">SMB</option>
                    </select>
                </div>

                {adapterType === 'local' && (
                    <div className="flex flex-col gap-1 mb-3">
                        <Label htmlFor="basePath">Base Path</Label>
                        <Input
                            id="basePath"
                            value={settings.basePath || ''}
                            onChange={e => setSettings({ ...settings, basePath: e.target.value })}
                            placeholder="e.g. /var/logs"
                            autoComplete="off"
                        />
                    </div>
                )}
                {adapterType === 'sftp' && (
                    <>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpHost">Host</Label>
                            <Input
                                id="sftpHost"
                                value={settings.host || ''}
                                onChange={e => setSettings({ ...settings, host: e.target.value })}
                                placeholder="hostname or IP"
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpPort">Port</Label>
                            <Input
                                id="sftpPort"
                                type="number"
                                value={settings.port ?? ''}
                                onChange={e => setSettings({ ...settings, port: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="22"
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpUser">Username</Label>
                            <Input
                                id="sftpUser"
                                value={settings.username || ''}
                                onChange={e => setSettings({ ...settings, username: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpPassword">Password</Label>
                            <Input
                                id="sftpPassword"
                                type="password"
                                value={settings.password || ''}
                                onChange={e => setSettings({ ...settings, password: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpPrivateKey">Private Key</Label>
                            <Input
                                id="sftpPrivateKey"
                                value={settings.privateKey || ''}
                                onChange={e => setSettings({ ...settings, privateKey: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="sftpRoot">Root</Label>
                            <Input
                                id="sftpRoot"
                                value={settings.root || ''}
                                onChange={e => setSettings({ ...settings, root: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                    </>
                )}
                {adapterType === 'smb' && (
                    <>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="smbShare">Share</Label>
                            <Input
                                id="smbShare"
                                value={settings.share || ''}
                                onChange={e => setSettings({ ...settings, share: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="smbUser">Username</Label>
                            <Input
                                id="smbUser"
                                value={settings.username || ''}
                                onChange={e => setSettings({ ...settings, username: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="smbPassword">Password</Label>
                            <Input
                                id="smbPassword"
                                type="password"
                                value={settings.password || ''}
                                onChange={e => setSettings({ ...settings, password: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                            <Label htmlFor="smbDomain">Domain</Label>
                            <Input
                                id="smbDomain"
                                value={settings.domain || ''}
                                onChange={e => setSettings({ ...settings, domain: e.target.value })}
                                autoComplete="off"
                            />
                        </div>
                    </>
                )}
                <div className="flex gap-2 mb-3">
                    {canSave && (
                        <Button type="button" variant="default" size="default" onClick={onSave}>
                            Save
                        </Button>
                    )}
                    <Button type="button" variant="secondary" size="default" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>

                {status && (
                    <div className={`text-xs ${status.kind === 'success' ? 'text-terminal-ansiGreen' : status.kind === 'error' ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>{status.text}</div>
                )}
            </div>
        </div>
    );
}
