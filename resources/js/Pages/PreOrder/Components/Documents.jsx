import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useForm } from "@inertiajs/react";
import {
    Chip,
    Button,
    Link,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import { when } from "./stage";

export const TAGS = [
    ["MEDICAL_HISTORY", "Medical history / report"],
    ["ID_CARD", "ID card"],
    ["CONSENT_FORM", "Consent form"],
    ["REQUEST_FORM", "Request form"],
    ["PRESCRIPTION", "Prescription"],
    ["DOCUMENT", "Other"],
];
// Quotation PDFs come from BION; a center never uploads with that tag.
const TAG_LABEL = { ...Object.fromEntries(TAGS), QUOTATION: "Quotation" };

/**
 * Files sent to BION. Only PDF, PNG and JPEG: BION checks each file before adding it, so a new
 * file shows up here once it has been accepted.
 */
export default function Documents({ preOrderId, documents, requests, canAct }) {
    const input = useRef(null);
    const openRequests = requests.filter((r) => r.status === "open");
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        file: null,
        title: "",
        description: "",
        tag: "MEDICAL_HISTORY",
        request: openRequests.length === 1 ? openRequests[0].number : "",
    });

    // Start the name from the file name; the center can make it clearer.
    const pickFile = (file) =>
        setData((d) => ({
            ...d,
            file,
            title: d.title || (file?.name ?? "").replace(/\.[^.]+$/, "").slice(0, 150),
        }));

    const send = () =>
        post(route("preOrders.documents.store", preOrderId), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset("file", "title", "description");
                if (input.current) input.current.value = "";
            },
        });

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No files yet.
                </Typography>
            ) : (
                <Table size="small">
                    <TableBody>
                        {documents.map((d) => (
                            <TableRow key={d.hash}>
                                <TableCell>
                                    <Link
                                        href={route("preOrders.documents.show", [
                                            preOrderId,
                                            d.hash,
                                        ])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {d.name}
                                    </Link>
                                    {d.from === "bion" && (
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            label="From BION"
                                            sx={{ ml: 1 }}
                                        />
                                    )}
                                    {d.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ whiteSpace: "pre-wrap", mt: 0.25 }}
                                        >
                                            {d.description}
                                        </Typography>
                                    )}
                                    {d.file_name && d.file_name !== d.name && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block" }}
                                        >
                                            {d.file_name}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>{TAG_LABEL[d.tag] ?? d.tag}</TableCell>
                                <TableCell>{when(d.created_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            {canAct && (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Send a file to BION</Typography>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems="flex-start"
                    >
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                            {data.file ? data.file.name : "Choose file"}
                            <input
                                ref={input}
                                hidden
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                            />
                        </Button>
                        <TextField
                            size="small"
                            label="Name"
                            required
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            error={Boolean(errors.title)}
                            inputProps={{ maxLength: 150 }}
                            sx={{ flex: 1, minWidth: 200 }}
                        />
                        <TextField
                            select
                            size="small"
                            label="What is it?"
                            value={data.tag}
                            onChange={(e) => setData("tag", e.target.value)}
                            sx={{ minWidth: 220 }}
                        >
                            {TAGS.map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </TextField>
                        {openRequests.length > 0 && (
                            <TextField
                                select
                                size="small"
                                label="For request"
                                value={data.request}
                                onChange={(e) => setData("request", e.target.value)}
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="">—</MenuItem>
                                {openRequests.map((r) => (
                                    <MenuItem key={r.number} value={r.number}>
                                        {r.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Stack>
                    <TextField
                        size="small"
                        label="Details (optional)"
                        placeholder="What is this file? e.g. the 12-week ultrasound report"
                        multiline
                        minRows={2}
                        fullWidth
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        error={Boolean(errors.description)}
                        inputProps={{ maxLength: 2000 }}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            variant="contained"
                            onClick={send}
                            disabled={processing || !data.file || !data.title.trim()}
                        >
                            {progress ? `Sending ${progress.percentage}%` : "Send"}
                        </Button>
                        <Typography
                            variant="caption"
                            color={
                                errors.file || errors.title || errors.description
                                    ? "error"
                                    : "text.secondary"
                            }
                        >
                            {errors.file ||
                                errors.title ||
                                errors.description ||
                                errors.tag ||
                                errors.request ||
                                "PDF, PNG or JPEG, up to 20 MB."}
                        </Typography>
                    </Stack>
                </Stack>
            )}
        </Paper>
    );
}

Documents.propTypes = {
    preOrderId: PropTypes.number.isRequired,
    documents: PropTypes.array.isRequired,
    requests: PropTypes.array.isRequired,
    canAct: PropTypes.bool,
};
