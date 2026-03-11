import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "../App";

// Mock VS Code API
const postMessage = jest.fn();
const state: any = {};

beforeAll(() => {
    (global as any).acquireVsCodeApi = () => ({
        postMessage,
        getState: () => state,
        setState: (s: any) => Object.assign(state, s),
    });
});

describe("Generic config App", () => {
    beforeEach(() => {
        postMessage.mockClear();
    });

    it("renders list and children", () => {
        const childFn = jest.fn(() => <div>child</div>);
        render(<App>{childFn}</App>);
        expect(screen.getByText("child")).toBeInTheDocument();
    });

    it("handles init message", () => {
        const callback = jest.fn();
        render(<App onConfigData={callback}>{() => <div />}</App>);
        window.postMessage({ type: "init", configs: ["a", "b"], current: { foo: "bar" } }, "*");
        expect(callback).toHaveBeenCalledWith({ foo: "bar" });
        expect(screen.getByText("a")).toBeInTheDocument();
        expect(screen.getByText("b")).toBeInTheDocument();
    });

    it("selects item and posts message", () => {
        const callback = jest.fn();
        render(<App onConfigData={callback}>{() => <div />}</App>);
        window.postMessage({ type: "init", configs: ["x"] }, "*");
        fireEvent.click(screen.getByText("x"));
        expect(postMessage).toHaveBeenCalledWith({ type: "selectConfig", name: "x" });
    });

    it("prevents selection when dirty and not confirmed", () => {
        window.confirm = jest.fn(() => false);
        const callback = jest.fn();
        render(
            <App dirty onConfigData={callback}>
                {() => <div />}
            </App>
        );
        window.postMessage({ type: "init", configs: ["x"] }, "*");
        fireEvent.click(screen.getByText("x"));
        expect(postMessage).not.toHaveBeenCalled();
    });

    it("notifies onError when configData contains an error", () => {
        const errorCb = jest.fn();
        render(<App onError={errorCb}>{() => <div />}</App>);
        window.postMessage({ type: "configData", config: null, error: "oops" }, "*");
        expect(errorCb).toHaveBeenCalledWith("oops");
    });

    it("highlights the selected name on init when current provided", () => {
        render(<App>{() => <div />}</App>);
        window.postMessage({ type: "init", configs: ["foo", "bar"], current: { shortName: "bar" } }, "*");
        const item = screen.getByText("bar");
        expect(item).toHaveClass("bg-[--button-bg]");
    });
});
