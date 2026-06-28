import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Smoke test for the Vitest + jsdom + Testing Library wiring (jest-dom matchers,
 * React 19 rendering). It renders a self-contained component so it stays green
 * regardless of app code — if this fails, the test harness itself is broken.
 */
function Greeting({ name }) {
    return <h1>Hello, {name}!</h1>;
}

describe("test harness", () => {
    it("renders a React component into jsdom", () => {
        render(<Greeting name="Provider" />);

        expect(screen.getByRole("heading")).toHaveTextContent("Hello, Provider!");
    });
});
