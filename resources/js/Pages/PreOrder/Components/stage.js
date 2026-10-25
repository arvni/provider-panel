// Shared bits for the pre-order pages. Everything BION or a center writes is shown as plain text.
export const ownerLabel = (owner) =>
    ({ center: "Waiting on you", bion: "With BION", none: "—" })[owner] ?? owner;

export const ownerColor = (owner) =>
    ({ center: "warning", bion: "info", none: "default" })[owner] ?? "default";

export const exceptionLabel = (exception) =>
    exception
        ? ({
              hold_center: "On hold (your request)",
              hold_bion: "On hold by BION",
              finance_rejected: "Quotation rejected or expired",
              sample_issue: "Sample issue – replacement required",
              not_eligible: "Not eligible",
              not_proceeding: "Not proceeding",
              cancelled: "Cancelled",
          }[exception.type] ?? exception.type)
        : null;

export const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");
