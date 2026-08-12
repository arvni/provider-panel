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
            // Inertia's setData takes either a key and a value or a whole object.
            setData: (key, value) =>
                setState((prev) => (typeof key === "object" ? key : { ...prev, [key]: value })),
            post,
            processing: false,
            errors: {},
            reset: () => setState(initial),
            clearErrors: () => {},
        };
    },
}));

import StandaloneRequestForm from "./StandaloneRequestForm";

const kits = [
    { id: 1, name: "Blood" },
    { id: 2, name: "Saliva" },
    { id: 3, name: "Tissue" },
];

const collectable = [
    { id: 4, name: "Serum" },
    { id: 5, name: "Plasma" },
];

const renderForm = (props = {}) =>
    render(
        <StandaloneRequestForm
            open
            onClose={props.onClose ?? vi.fn()}
            sampleTypes={props.sampleTypes ?? kits}
            collectableSampleTypes={props.collectableSampleTypes ?? collectable}
            canRequestKit={props.canRequestKit ?? true}
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

const chooseOrder = () => fireEvent.click(screen.getByRole("radio", { name: /order kits/i }));
const chooseCollect = () =>
    fireEvent.click(screen.getByRole("radio", { name: /collect my samples/i }));

describe("StandaloneRequestForm", () => {
    beforeEach(() => {
        global.route = vi.fn(() => "/collectRequests");
        formData = undefined;
    });

    it("asks what is needed before showing any list", () => {
        renderForm();

        expect(screen.getByText(/what do you need\?/i)).toBeInTheDocument();
        expect(screen.getByText(/tell us what you need/i)).toBeInTheDocument();
        // Neither branch's list is on screen yet.
        expect(screen.queryByRole("radio", { name: "Blood" })).not.toBeInTheDocument();
        expect(screen.queryByRole("checkbox", { name: "Serum" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /submit request/i })).toBeDisabled();
    });

    it("shows the kits once ordering is chosen", () => {
        renderForm();
        chooseOrder();

        expect(screen.getByText(/which kits do you want\?/i)).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Blood" })).toBeInTheDocument();
        // The collectable types belong to the other branch.
        expect(screen.queryByRole("checkbox", { name: "Serum" })).not.toBeInTheDocument();
    });

    it("shows the collectable sample types once collection is chosen", () => {
        renderForm();
        chooseCollect();

        expect(screen.getByText(/which samples do you have\?/i)).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Serum" })).toBeInTheDocument();
        expect(screen.queryByRole("checkbox", { name: "Blood" })).not.toBeInTheDocument();
    });

    it("collects one kit, its quantity, the date and the comment", () => {
        renderForm();
        chooseOrder();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        fireEvent.click(screen.getByRole("button", { name: /one more kit/i }));
        fireEvent.click(screen.getByText("Today"));
        fireEvent.change(screen.getByLabelText(/comment/i), { target: { value: "Running low" } });

        expect(formData).toEqual({
            mode: "order",
            kits: [{ sample_type: 1, amount: 2 }],
            sample_types: [],
            preferred_date: todayValue(),
            comment: "Running low",
        });

        fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
        expect(post).toHaveBeenCalledWith("/collectRequests", expect.any(Object));
    });

    it("collects several kits, each with its own quantity", () => {
        renderForm();
        chooseOrder();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Tissue" }));

        // Each chosen kit gets its own stepper, in the order they were ticked.
        const steppers = screen.getAllByRole("button", { name: /one more kit/i });
        expect(steppers).toHaveLength(2);
        fireEvent.click(steppers[1]);
        fireEvent.click(steppers[1]);

        expect(formData.kits).toEqual([
            { sample_type: 1, amount: 1 },
            { sample_type: 3, amount: 3 },
        ]);

        // Un-ticking one leaves the other, and its quantity, alone.
        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        expect(formData.kits).toEqual([{ sample_type: 3, amount: 3 }]);
    });

    it("re-ticking a kit starts its quantity over", () => {
        renderForm();
        chooseOrder();

        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        fireEvent.click(screen.getByRole("button", { name: /one more kit/i }));
        expect(formData.kits).toEqual([{ sample_type: 2, amount: 2 }]);

        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        expect(formData.kits).toEqual([{ sample_type: 2, amount: 1 }]);
    });

    it("collects several sample types for a pickup", () => {
        renderForm();
        chooseCollect();

        fireEvent.click(screen.getByRole("checkbox", { name: "Serum" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Plasma" }));
        fireEvent.click(screen.getByText("Tomorrow"));

        expect(formData).toMatchObject({ mode: "collect", sample_types: [4, 5] });
        expect(screen.getByRole("button", { name: /submit request/i })).toBeEnabled();

        // Deselecting removes it again.
        fireEvent.click(screen.getByRole("checkbox", { name: "Serum" }));
        expect(formData.sample_types).toEqual([5]);
    });

    it("switching what you need clears the other branch's answer", () => {
        renderForm();

        chooseCollect();
        fireEvent.click(screen.getByRole("checkbox", { name: "Serum" }));
        expect(formData.sample_types).toEqual([4]);

        chooseOrder();
        expect(formData).toMatchObject({ mode: "order", sample_types: [], kits: [] });

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        fireEvent.click(screen.getByRole("button", { name: /one more kit/i }));
        chooseCollect();
        expect(formData.kits).toEqual([]);
    });

    it("cannot be submitted until a choice and a date are made", () => {
        renderForm();

        const submit = screen.getByRole("button", { name: /submit request/i });
        chooseOrder();
        expect(submit).toBeDisabled();
        expect(screen.getByText(/choose at least one kit/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        expect(submit).toBeDisabled();
        expect(screen.getByText(/pick a collection date/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText("Tomorrow"));
        expect(submit).toBeEnabled();
    });

    it("the quantity stays within one and a hundred", () => {
        renderForm();
        chooseOrder();

        fireEvent.click(screen.getByRole("checkbox", { name: "Saliva" }));
        expect(screen.getByRole("button", { name: /one fewer kit/i })).toBeDisabled();

        fireEvent.change(screen.getByRole("spinbutton", { name: /number of kits/i }), {
            target: { value: "500" },
        });
        expect(formData.kits).toEqual([{ sample_type: 2, amount: 100 }]);
        expect(screen.getByRole("button", { name: /one more kit/i })).toBeDisabled();
    });

    it("drops every kit again from the summary chip", () => {
        renderForm();
        chooseOrder();

        // While there is only one, the chip spells it out.
        fireEvent.click(screen.getByRole("checkbox", { name: "Blood" }));
        expect(screen.getByText("1 × Blood")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("checkbox", { name: "Tissue" }));

        const chip = screen.getByText("2 kits selected").closest(".MuiChip-root");
        fireEvent.click(within(chip).getByTestId("CancelIcon"));

        expect(formData.kits).toEqual([]);
    });

    it("says so when the laboratory has marked nothing collectable", () => {
        renderForm({ collectableSampleTypes: [] });
        chooseCollect();

        expect(screen.getByText(/no sample types are collectable yet/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /submit request/i })).toBeDisabled();
    });

    it("skips the question entirely for providers who may not order kits", () => {
        renderForm({ canRequestKit: false });

        expect(screen.queryByText(/what do you need\?/i)).not.toBeInTheDocument();
        // Straight to the pickup list.
        expect(screen.getByRole("checkbox", { name: "Serum" })).toBeInTheDocument();
        expect(formData.mode).toBe("collect");
    });
});
