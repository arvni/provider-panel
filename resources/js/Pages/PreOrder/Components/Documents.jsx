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
        tag: "MEDICAL_HISTORY",
        request: openRequests.length === 1 ? openRequests[0].number : "",
    });

    const send = () =>
        post(route("preOrders.documents.store", preOrderId), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset("file");
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
                                </TableCell>
                                <TableCell>{TAG_LABEL[d.tag] ?? d.tag}</TableCell>
                                <TableCell>{when(d.created_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            {canAct && (
                <Stack spacing={1} sx={{ mt: 2 }}>
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
                                onChange={(e) => setData("file", e.target.files?.[0] ?? null)}
                            />
                        </Button>
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
                        <Button
                            variant="contained"
                            onClick={send}
                            disabled={processing || !data.file}
                        >
                            {progress ? `Sending ${progress.percentage}%` : "Send"}
                        </Button>
                    </Stack>
                    <Typography variant="caption" color={errors.file ? "error" : "text.secondary"}>
                        {errors.file ||
                            errors.tag ||
                            errors.request ||
                            "PDF, PNG or JPEG, up to 20 MB."}
                    </Typography>
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
