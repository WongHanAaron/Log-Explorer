import { UiE2EStep } from "./types";
import { WebviewDriver } from "./webviewDriver";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface CommandExecutionContext {
    driver: WebviewDriver;
    state: Record<string, unknown>;
    debug: boolean;
    onCommand?: (command: string, step: UiE2EStep) => Promise<void>;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveUrl(url: string, state: Record<string, unknown>): string {
    if (url.includes("{{fixturePath}}")) {
        const fixturePath = String(state.fixturePath ?? "");
        const withPath = url.replace("{{fixturePath}}", fixturePath.replace(/\\/g, "/"));
        if (withPath.startsWith("file://")) {
            return withPath;
        }
        return pathToFileURL(path.resolve(withPath)).href;
    }
    return url;
}

export async function executeStepAction(step: UiE2EStep, ctx: CommandExecutionContext): Promise<void> {
    switch (step.actionType) {
        case "openBrowser": {
            const headless = step.input === "headless";
            await ctx.driver.openBrowser(headless ? true : false, ctx.debug ? 250 : 0);
            ctx.state.browserOpened = true;
            return;
        }
        case "goto": {
            if (typeof step.target.url === "string") {
                await ctx.driver.goto(resolveUrl(step.target.url, ctx.state));
            }
            return;
        }
        case "click": {
            if (typeof step.target.selector === "string") {
                await ctx.driver.click(step.target.selector);
            }
            return;
        }
        case "input": {
            if (typeof step.target.selector === "string") {
                await ctx.driver.input(step.target.selector, String(step.input ?? ""));
            }
            return;
        }
        case "waitForSelector": {
            if (typeof step.target.selector === "string") {
                await ctx.driver.waitForSelector(step.target.selector, step.timeoutMs);
            }
            return;
        }
        case "command": {
            const command = step.target.command;
            if (command) {
                ctx.state.lastCommand = command;
                if (command === "message.send") {
                    const payload = (step.input as Record<string, unknown> | undefined) ?? {};
                    ctx.state.lastDispatchedMessageType = String(payload.type ?? "unknown");
                }
                if (ctx.onCommand) {
                    await ctx.onCommand(command, step);
                }
            }
            if (typeof step.target.stateKey === "string") {
                ctx.state[step.target.stateKey] = step.input;
            }
            return;
        }
        case "pause": {
            const duration = typeof step.input === "number" ? step.input : 500;
            await sleep(duration);
            return;
        }
        default:
            return;
    }
}
