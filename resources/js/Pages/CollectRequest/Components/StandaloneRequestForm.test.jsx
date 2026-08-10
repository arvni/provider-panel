import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

// The dialog posts through Inertia's useForm; stub it so the test drives the
// component's own state and can inspect exactly what would be submitted.
const post = vi.fn();
let formData;

vi.mock("@inertiajs/react", () => ({
    useForm: (initial) => {
        const [data, setState] = React.useState(initial);
        formData = data;

        return {
            data,
            setData: (key, value) => setState((prev) => ({ ...prev, [key]: value })),
            post,
            processing: false,
            errors: {},
            reset: () => setState(initial),
            clearErrors: () => {},
        };
    },
}));

import StandaloneRequestForm from "./StandaloneRequestForm";

const sampleTypes = [
    { id: 1, name: "Blood" },
    { id: 2, name: "Saliva" },
    { id: 3, name: "Tissue" },
];

const renderForm = (props = {}) =>
    render(
        <StandaloneRequestForm
            open
            onClose={props.onClose ?? vi.fn()}
            sampleTypes={props.sampleTypes ?? sampleTypes}
        />
    );

const todayValue = () => {
    const today = new Date();
    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");
};

describe("StandaloneRequestForm", () => {
    beforeEach(() => {
        global.route = vi.fn(() => "/collectRequests");
        formData = undefined;
    });

    it("cannot be submitted until a sample type and a date are chosen", () => {
        renderForm();

        const submit = screen.getByRole("button", { name: /submit request/i });
        expect(submit).toBeDisabled();
        expect(screen.getByText(/select at least one sample type/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        // Still missing a date.
        expect(submit).toBeDisabled();

        fireEvent.click(screen.getByText("Tomorrow"));
        expect(submit).toBeEnabled();
    });

    it("collects the selected types, the preset date and the comment", () => {
        renderForm();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Tissue" }));
        fireEvent.click(screen.getByText("Today"));
        fireEvent.change(screen.getByLabelText(/comment/i), { target: { value: "Two tubes" } });

        expect(formData).toEqual({
            sample_types: [1, 3],
            preferred_date: todayValue(),
            comment: "Two tubes",
        });

        fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
        expect(post).toHaveBeenCalledWith("/collectRequests", expect.any(Object));
    });

    it("deselecting a type removes it again", () => {
        renderForm();

        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        expect(formData.sample_types).toEqual([2]);

        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        expect(formData.sample_types).toEqual([]);
    });

    it("clears every selection from the summary chip", () => {
        renderForm();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));

        const chip = screen.getByText("2 selected").closest(".MuiChip-root");
        fireEvent.click(within(chip).getByTestId("CancelIcon"));

        expect(formData.sample_types).toEqual([]);
    });

    it("tells the user when the laboratory has no sample types", () => {
        renderForm({ sampleTypes: [] });

        expect(screen.getByText(/no sample types are available/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /submit request/i })).toBeDisabled();
    });
});
