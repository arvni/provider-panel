import { describe, it, expect, vi } from "vitest";
import { validateFullOrder } from "./finalizeValidation";

/** A minimal order that passes every rule. */
function validOrder() {
    return {
        tests: [{ name: "Test A" }],
        patient: { fullName: "Jane Doe", dateOfBirth: "2000-01-01", gender: 1 },
        orderForms: [
            { formData: [{ label: "Field", value: "x", required: true, type: "text" }] },
        ],
        samples: [{ sample_type: { name: "Blood" }, collectionDate: "2026-01-01" }],
        consents: [{ title: "Consent A", value: true }],
    };
}

describe("validateFullOrder", () => {
    it("returns true and records no errors for a complete order", () => {
        const setError = vi.fn();
        expect(validateFullOrder(validOrder(), setError)).toBe(true);
        expect(setError).not.toHaveBeenCalled();
    });

    it("fails when no tests are selected", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), tests: [] };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("tests", expect.any(String));
    });

    it("fails and flags each missing required patient field", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), patient: {} };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("patient.fullName", expect.any(String));
        expect(setError).toHaveBeenCalledWith("patient.dateOfBirth", expect.any(String));
        expect(setError).toHaveBeenCalledWith("patient.gender", expect.any(String));
    });

    it("fails when the patient object is missing entirely", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), patient: null };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("patient", expect.any(String));
    });

    it("records errors for a required, empty order-form field", () => {
        const setError = vi.fn();
        const order = {
            ...validOrder(),
            orderForms: [{ formData: [{ label: "Field", value: "", required: true, type: "text" }] }],
        };

        // Characterizes the original behaviour: both the field-level and the
        // form-level error keys are set so the UI highlights the section. Note
        // the return value is governed by the original `isValid = field.type !==
        // "description"` assignment (not an AND), so a lone empty required field
        // still reports `true` even though the error is recorded — preserved
        // here so any intentional future fix shows up as a test change.
        const result = validateFullOrder(order, setError);
        expect(setError).toHaveBeenCalledWith("orderForms[0].formData[0].value", expect.any(String));
        expect(setError).toHaveBeenCalledWith("orderForms[0].hasErrors", expect.any(String));
        expect(result).toBe(true);
    });

    it("ignores required description fields (no value expected)", () => {
        const setError = vi.fn();
        const order = {
            ...validOrder(),
            orderForms: [{ formData: [{ label: "Note", value: "", required: true, type: "description" }] }],
        };
        expect(validateFullOrder(order, setError)).toBe(true);
    });

    it("fails when there are no samples", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), samples: [] };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("samples", expect.any(String));
    });

    it("fails when a consent item is not agreed to", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), consents: [{ title: "Consent A", value: false }] };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("consents[0].value", expect.any(String));
    });

    it("fails when consent information is missing", () => {
        const setError = vi.fn();
        const order = { ...validOrder(), consents: [] };
        expect(validateFullOrder(order, setError)).toBe(false);
        expect(setError).toHaveBeenCalledWith("consents", expect.any(String));
    });
});
