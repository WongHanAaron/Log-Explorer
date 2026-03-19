import { HostOutcome, MessageTraceEvent } from "./types";

export class RuntimeTraceRecorder {
    private ordinals = new Map<string, number>();
    private events = new Map<string, MessageTraceEvent[]>();
    private outcomes = new Map<string, HostOutcome[]>();

    public recordEvent(input: Omit<MessageTraceEvent, "ordinal" | "timestamp">): MessageTraceEvent {
        const ordinal = (this.ordinals.get(input.sessionId) ?? 0) + 1;
        this.ordinals.set(input.sessionId, ordinal);

        const event: MessageTraceEvent = {
            ...input,
            ordinal,
            timestamp: new Date().toISOString()
        };

        const list = this.events.get(input.sessionId) ?? [];
        list.push(event);
        this.events.set(input.sessionId, list);
        return event;
    }

    public recordOutcome(outcome: HostOutcome): void {
        const list = this.outcomes.get(outcome.sessionId) ?? [];
        list.push(outcome);
        this.outcomes.set(outcome.sessionId, list);
    }

    public getTrace(sessionId: string): MessageTraceEvent[] {
        return [...(this.events.get(sessionId) ?? [])];
    }

    public getOutcomes(sessionId: string): HostOutcome[] {
        return [...(this.outcomes.get(sessionId) ?? [])];
    }
}
