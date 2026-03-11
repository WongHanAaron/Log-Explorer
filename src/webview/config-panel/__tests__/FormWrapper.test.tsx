import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FormWrapper, confirmDiscard } from "../components/FormWrapper";

describe("FormWrapper and confirmDiscard", () => {
    it("renders children without modification", () => {
        render(
            <FormWrapper dirty={false}>
                <div>content</div>
            </FormWrapper>
        );
        expect(screen.getByText("content")).toBeInTheDocument();
    });

    it("confirmDiscard returns true when not dirty", () => {
        expect(confirmDiscard(false)).toBe(true);
    });

    it("confirmDiscard prompts and respects user choice", () => {
        window.confirm = jest.fn(() => true);
        expect(confirmDiscard(true)).toBe(true);
        expect(window.confirm).toHaveBeenCalled();
        (window.confirm as jest.Mock).mockReturnValue(false);
        expect(confirmDiscard(true)).toBe(false);
    });
});
