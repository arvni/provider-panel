// Vitest global setup: register jest-dom matchers (toBeInTheDocument, etc.)
// and reset the DOM/mocks between tests.
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
    cleanup();
});
