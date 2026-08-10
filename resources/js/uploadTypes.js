// File types the server accepts, kept in sync with App\Rules\SafeUpload.
// SVG is excluded on purpose: it is an XML document that can carry script.
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
export const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
export const ACCEPTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];

// Value for an <input type="file"> accept attribute.
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");
export const ACCEPT_DOCUMENTS = DOCUMENT_EXTENSIONS.join(",");

// Per-file ceiling, matching App\Rules\SafeUpload::MAX_KILOBYTES.
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

// Ceiling for one submission, matching post_max_size in the Dockerfiles. A body
// over that limit reaches PHP empty, which surfaces as a confusing "field is
// required" rather than a size error, so it is worth catching here.
export const MAX_TOTAL_BYTES = 240 * 1024 * 1024;

export const formatBytes = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`;

export const extensionOf = (fileName) =>
    `.${(fileName ?? "").split(".").pop().toLowerCase()}`;

export const isAcceptedFile = (file, allowed = ACCEPTED_EXTENSIONS) =>
    allowed.includes(extensionOf(file.name));
