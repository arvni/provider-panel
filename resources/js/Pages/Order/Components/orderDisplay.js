/**
 * Shared display helpers for the Order Show + Finalize pages.
 *
 * These were previously duplicated verbatim inside the two 1800–2000 line page
 * components. Extracting them keeps a single source of truth and makes the
 * logic unit-testable independent of MUI rendering.
 */

/**
 * Normalize the order `consents` payload, which arrives either as a plain array
 * of consent items, or as an object keyed by consent id plus a `consentForm`
 * entry holding uploaded form file paths.
 *
 * @param {Array|Object|null|undefined} consents
 * @returns {{ restConsents: Array, consentForm: Array|null }}
 */
export function processConsentData(consents) {
    if (!consents) return { restConsents: [], consentForm: null };

    if (Array.isArray(consents)) {
        return { restConsents: consents, consentForm: null };
    }

    const consentForm = consents.consentForm ?? null;
    const restConsents = Object.keys(consents)
        .filter((key) => key !== "consentForm")
        .map((key) => consents?.[key])
        .filter(Boolean);

    return { restConsents, consentForm };
}

/**
 * Short date (e.g. "Jun 28, 2026") using the runtime's default locale.
 * Returns "Not specified" for empty values, and echoes the raw string if it
 * cannot be parsed.
 */
export function formatShortDate(dateString) {
    if (!dateString) return "Not specified";

    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return dateString;
    }
}

/**
 * Long date (e.g. "June 28, 2026") in en-US, used by the Finalize summary.
 * Returns "Not specified" for empty values, and echoes the raw string if it
 * cannot be parsed.
 */
export function formatLongDate(dateString) {
    if (!dateString) return "Not specified";

    try {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
}
