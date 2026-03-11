import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigList } from "../components/ConfigList";

describe("ConfigList component", () => {
    const names = ["one", "two", "three"];
    it("renders all names and highlights selected", () => {
        const onSelect = jest.fn();
        render(<ConfigList names={names} selected="two" onSelect={onSelect} />);
        expect(screen.getByText("one")).toBeInTheDocument();
        expect(screen.getByText("two")).toHaveClass("bg-[--button-bg]");
        expect(screen.getByText("three")).toBeInTheDocument();
    });

    it("calls onSelect when an item is clicked", () => {
        const onSelect = jest.fn();
        render(<ConfigList names={names} selected={null} onSelect={onSelect} />);
        fireEvent.click(screen.getByText("three"));
        expect(onSelect).toHaveBeenCalledWith("three");
    });

    it("filters names when search text changes", () => {
        const onSelect = jest.fn();
        render(<ConfigList names={names} selected={null} onSelect={onSelect} />);
        const input = screen.getByPlaceholderText("Search");
        fireEvent.change(input, { target: { value: "t" } });
        expect(screen.queryByText("one")).not.toBeInTheDocument();
        expect(screen.getByText("two")).toBeInTheDocument();
        expect(screen.getByText("three")).toBeInTheDocument();
    });
});
