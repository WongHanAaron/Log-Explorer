export interface SessionIsolationScope {
    sessionId: string;
    state: Record<string, unknown>;
}

const sessionStates = new Map<string, Record<string, unknown>>();

export function createSessionScope(sessionId: string, initialState?: Record<string, unknown>): SessionIsolationScope {
    const state = {
        ...(initialState ?? {})
    };
    sessionStates.set(sessionId, state);
    return {
        sessionId,
        state
    };
}

export function getSessionScope(sessionId: string): SessionIsolationScope | undefined {
    const state = sessionStates.get(sessionId);
    if (!state) {
        return undefined;
    }
    return {
        sessionId,
        state
    };
}

export function disposeSessionScope(sessionId: string): void {
    sessionStates.delete(sessionId);
}
