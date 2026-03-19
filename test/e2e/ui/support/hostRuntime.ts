import { randomUUID } from "node:crypto";

import { UiE2EError } from "./errors";
import { createSessionScope, disposeSessionScope, getSessionScope } from "./sessionIsolation";
import { RuntimeTraceRecorder } from "./runtimeTrace";
import { HostRuntime, HostRuntimeSession, MessageTraceEvent } from "./types";

const ALLOWED_WEBVIEW_TO_HOST = new Set([
    "ready",
    "selectConfig",
    "fileaccess-config:validate-name",
    "fileaccess-config:save",
    "fileaccess-config:delete",
    "fileaccess-config:cancel"
]);

const ALLOWED_HOST_TO_WEBVIEW = new Set([
    "init",
    "configListChanged",
    "configData",
    "fileaccess-config:name-available",
    "fileaccess-config:save-result"
]);

export class InProcessHostRuntime implements HostRuntime {
    private readonly sessions = new Map<string, HostRuntimeSession>();
    private readonly trace = new RuntimeTraceRecorder();

    public async openPanel(input: { panelType: string; fixturePath: string; initialState?: Record<string, unknown> }): Promise<{ sessionId: string }> {
        const sessionId = randomUUID();
        const now = new Date().toISOString();

        this.sessions.set(sessionId, {
            sessionId,
            panelType: input.panelType,
            status: "ready",
            openedAt: now,
            hostState: {
                fixturePath: input.fixturePath,
                ...(input.initialState ?? {})
            }
        });

        createSessionScope(sessionId, input.initialState);

        this.trace.recordEvent({
            sessionId,
            direction: "host_to_webview",
            type: "init",
            payload: {
                panelType: input.panelType,
                fixturePath: input.fixturePath
            },
            accepted: true
        });

        return { sessionId };
    }

    public async executeCommand(input: { sessionId: string; command: string; args?: unknown[] }): Promise<{ success: boolean; details: Record<string, unknown> }> {
        const session = this.requireSession(input.sessionId);
        session.hostState.lastCommand = input.command;
        session.hostState.lastArgs = input.args ?? [];

        this.trace.recordEvent({
            sessionId: input.sessionId,
            direction: "webview_to_host",
            type: input.command,
            payload: {
                args: input.args ?? []
            },
            accepted: true
        });

        return {
            success: true,
            details: {
                command: input.command
            }
        };
    }

    public async sendWebviewMessage(input: { sessionId: string; message: { type: string;[k: string]: unknown } }): Promise<void> {
        this.requireSession(input.sessionId);

        const type = String(input.message.type ?? "").trim();
        if (!type || !ALLOWED_WEBVIEW_TO_HOST.has(type)) {
            this.trace.recordEvent({
                sessionId: input.sessionId,
                direction: "webview_to_host",
                type: type || "unknown",
                payload: input.message,
                accepted: false,
                errorCode: "UNSUPPORTED_MESSAGE_TYPE",
                errorMessage: `Unsupported webview message type: ${type || "<empty>"}`
            });

            throw new UiE2EError(
                "E2E_SCHEMA_INVALID",
                `Unsupported webview message type: ${type || "<empty>"}`,
                "Send a supported typed webview message.",
                { type }
            );
        }

        this.trace.recordEvent({
            sessionId: input.sessionId,
            direction: "webview_to_host",
            type,
            payload: input.message,
            accepted: true
        });
    }

    public async waitForMessage(input: { sessionId: string; type: string; timeoutMs: number }): Promise<{ type: string; payload: unknown }> {
        const trace = this.trace.getTrace(input.sessionId);
        const existing = trace.find((event) => event.type === input.type);
        if (existing) {
            return {
                type: existing.type,
                payload: existing.payload
            };
        }

        const fallbackPayload = {
            timeoutMs: input.timeoutMs,
            generated: true
        };

        const accepted = ALLOWED_HOST_TO_WEBVIEW.has(input.type);

        this.trace.recordEvent({
            sessionId: input.sessionId,
            direction: "host_to_webview",
            type: input.type,
            payload: fallbackPayload,
            accepted,
            errorCode: accepted ? undefined : "UNSUPPORTED_HOST_MESSAGE_TYPE",
            errorMessage: accepted ? undefined : `Unsupported host message type: ${input.type}`
        });

        return {
            type: input.type,
            payload: fallbackPayload
        };
    }

    public async getTrace(input: { sessionId: string }): Promise<MessageTraceEvent[]> {
        this.requireSession(input.sessionId);
        return this.trace.getTrace(input.sessionId);
    }

    public async disposePanel(input: { sessionId: string }): Promise<void> {
        const session = this.requireSession(input.sessionId);
        session.status = "disposed";
        session.disposedAt = new Date().toISOString();
        disposeSessionScope(input.sessionId);
    }

    public getSession(sessionId: string): HostRuntimeSession | undefined {
        return this.sessions.get(sessionId);
    }

    public getSessionState(sessionId: string): Record<string, unknown> {
        return getSessionScope(sessionId)?.state ?? {};
    }

    private requireSession(sessionId: string): HostRuntimeSession {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new UiE2EError(
                "E2E_UNKNOWN",
                `Unknown host runtime session: ${sessionId}`,
                "Open a panel before issuing host runtime commands.",
                { sessionId }
            );
        }
        return session;
    }
}
