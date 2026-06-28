import { describe, it, expect } from "vitest";
import { processConsentData, formatShortDate, formatLongDate } from "./orderDisplay";

describe("processConsentData", () => {
    it("returns empty defaults for null/undefined", () => {
        expect(processConsentData(null)).toEqual({ restConsents: [], consentForm: null });
        expect(processConsentData(undefined)).toEqual({ restConsents: [], consentForm: null });
    });

    it("passes an array through untouched with no consent form", () => {
        const consents = [{ title: "A", value: true }, { title: "B", value: false }];
        expect(processConsentData(consents)).toEqual({ restConsents: consents, consentForm: null });
    });

    it("splits the consentForm key out of an object-shaped payload", () => {
        const a = { title: "A", value: true };
        const b = { title: "B", value: false };
        const { restConsents, consentForm } = processConsentData({
            1: a,
            2: b,
            consentForm: ["form-1.pdf"],
        });

        expect(restConsents).toEqual([a, b]);
        expect(consentForm).toEqual(["form-1.pdf"]);
    });

    it("drops falsy consent entries from an object payload", () => {
        const a = { title: "A", value: true };
        const { restConsents } = processConsentData({ 1: a, 2: null, 3: undefined });
        expect(restConsents).toEqual([a]);
    });

    it("defaults consentForm to null when absent on an object payload", () => {
        expect(processConsentData({ 1: { title: "A" } }).consentForm).toBeNull();
    });
});

describe("formatShortDate", () => {
    it("returns 'Not specified' for empty values", () => {
        expect(formatShortDate(null)).toBe("Not specified");
        expect(formatShortDate("")).toBe("Not specified");
    });

    it("formats a parseable date with a short month", () => {
        // Use an explicit UTC time so the local-date rollover can't shift the day.
        expect(formatShortDate("2026-06-28T12:00:00Z")).toMatch(/Jun.*2026/);
    });
});

describe("formatLongDate", () => {
    it("returns 'Not specified' for empty values", () => {
        expect(formatLongDate(null)).toBe("Not specified");
    });

    it("formats a parseable date with a long month in en-US", () => {
        expect(formatLongDate("2026-06-28T12:00:00Z")).toMatch(/June 28, 2026/);
    });
});
