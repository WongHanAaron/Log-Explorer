export type UiE2EErrorCode =
    | "E2E_SCHEMA_INVALID"
    | "E2E_SCENARIO_NOT_FOUND"
    | "E2E_FIXTURE_MISSING"
    | "E2E_PLAYWRIGHT_NOT_INSTALLED"
    | "E2E_BROWSER_NOT_STARTED"
    | "E2E_ASSERTION_FAILED"
    | "E2E_UNKNOWN";

export class UiE2EError extends Error {
    public readonly code: UiE2EErrorCode;
    public readonly action: string;
    public readonly context?: Record<string, unknown>;

    public constructor(
        code: UiE2EErrorCode,
        message: string,
        action: string,
        context?: Record<string, unknown>
    ) {
        super(message);
        this.code = code;
        this.action = action;
        this.context = context;
    }
}

export function toUiE2EError(error: unknown): UiE2EError {
    if (error instanceof UiE2EError) {
        return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new UiE2EError("E2E_UNKNOWN", message, "Inspect stack trace and scenario contract for root cause.");
}
